<template>
  <div>
    <n-tabs v-model:value="activeTab" type="line" @update:value="onTabChange">
      <n-tab-pane name="my" tab="我的流程" />
      <n-tab-pane name="manager" tab="流程管理" />
    </n-tabs>

    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button type="primary" @click="goCreate">
          发起流程
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      :col-setting-key="`bpm-process-instance-${activeTab}`"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.id as string"
      :loading="loading"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <n-modal
      v-model:show="cancelVisible"
      preset="dialog"
      :title="cancelTitle"
      positive-text="确认"
      negative-text="取消"
      :loading="cancelSubmitting"
      @positive-click="submitCancel"
    >
      <n-input
        v-model:value="cancelReason"
        type="textarea"
        :rows="3"
        placeholder="请输入取消原因"
      />
    </n-modal>
  </div>
</template>

<script setup lang="tsx">
import { useRouter } from 'vue-router'
import { NButton, NSpace } from 'naive-ui'
import {
  cancelProcessInstanceByAdmin,
  cancelProcessInstanceByStartUser,
  getProcessInstanceManagerPage,
  getProcessInstanceMyPage,
} from '@/api/bpm/processInstance'
import { CategoryApi } from '@/api/bpm/category'
import { getSimpleProcessDefinitionList } from '@/api/bpm/definition'
import { buildBpmPageQuery, toBpmPageResult } from './constants'
import { defineFields, extractSearchDefaults } from '@/utils/schema'
import { usePageList } from '@/hooks/usePageList'
import { pushBpmProcessCreate, pushBpmProcessDetail } from './routeNames'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import { formatDurationOrDash } from '@/utils/formatTime'
import { renderBpmSummary, renderProcessInstanceStatus } from './utils/listRender'

defineOptions({ name: 'Bpm-ProcessInstance' })

const router = useRouter()
const message = useMessage()
const activeTab = ref<'my' | 'manager'>('my')

const cancelVisible = ref(false)
const cancelSubmitting = ref(false)
const cancelReason = ref('')
const cancelRow = ref<any>(null)
const cancelAsAdmin = ref(false)
const cancelTitle = computed(() => (cancelAsAdmin.value ? '管理员取消流程' : '取消流程'))

const categoryOptions = ref<{ label: string, value: string }[]>([])
const processDefinitionOptions = ref<{ label: string, value: string }[]>([])

const statusOptions = [
  { label: '进行中', value: 1 },
  { label: '已通过', value: 2 },
  { label: '已拒绝', value: 3 },
  { label: '已取消', value: 4 },
]

const searchFields = computed(() => defineFields([
  {
    key: 'name',
    label: '流程名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
  {
    key: 'category',
    label: '流程分类',
    component: 'NSelect',
    options: categoryOptions.value,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: false,
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: statusOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: false,
  },
  {
    key: 'processDefinitionKey',
    label: '所属流程',
    component: 'NSelect',
    options: processDefinitionOptions.value,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: false,
  },
  {
    key: 'createTime',
    label: '发起时间',
    component: 'NDatePicker',
    bind: {
      type: 'daterange',
      clearable: true,
      valueFormat: 'yyyy-MM-dd',
    },
    search: { enabled: true, span: 8, defaultValue: null },
    form: false,
    table: false,
  },
]))

const tableFields = computed(() => defineFields([
  {
    key: 'name',
    label: '流程名称',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 160 },
  },
  {
    key: 'summary',
    label: '摘要',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      minWidth: 180,
      render: (row: any) => renderBpmSummary(row.summary),
    },
  },
  {
    key: 'category',
    label: '流程分类',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 120,
      render: (row: any) => row.categoryName || row.category || '-',
    },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: statusOptions,
    form: false,
    search: false,
    table: {
      minWidth: 200,
      render: (row: any) => renderProcessInstanceStatus(row, goDetail),
    },
  },
  {
    key: 'startUserNickname',
    label: '发起人',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 120,
      render: (row: any) => row.startUserNickname || row.startUser?.nickname || '-',
    },
  },
  {
    key: 'createTime',
    label: '发起时间',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 180,
      render: (row: any) => row.startTime || row.createTime || '-',
    },
  },
  {
    key: 'endTime',
    label: '结束时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 180 },
  },
  {
    key: 'durationInMillis',
    label: '耗时',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 140,
      render: (row: any) => formatDurationOrDash(row.durationInMillis),
    },
  },
  {
    key: 'actions',
    label: '操作',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: activeTab.value === 'my' ? 200 : 160,
      fixed: 'right',
      render: (row: any) => (
        <NSpace size={8}>
          <NButton text type="primary" onClick={() => goDetail(row)}>
            详情
          </NButton>
          {row.status === BpmProcessInstanceStatus.RUNNING && (
            <NButton text type="error" onClick={() => openCancel(row, activeTab.value === 'manager')}>
              取消
            </NButton>
          )}
          {activeTab.value === 'my' && row.status !== BpmProcessInstanceStatus.RUNNING && (
            <NButton text type="primary" onClick={() => goReCreate(row)}>
              重新发起
            </NButton>
          )}
        </NSpace>
      ),
    },
  },
]))

const {
  searchModel,
  tableData,
  total,
  loading,
  fetchList,
  handleSearch,
  onPageChange,
  onPageSizeChange,
} = usePageList({
  fetcher: async (query) => {
    const params = buildBpmPageQuery(query)
    const data = activeTab.value === 'my'
      ? await getProcessInstanceMyPage(params)
      : await getProcessInstanceManagerPage(params)
    return toBpmPageResult(data as any)
  },
  defaults: extractSearchDefaults(searchFields.value),
})

function onTabChange() {
  fetchList()
}

function goDetail(row: any) {
  pushBpmProcessDetail(router, { id: String(row.id) })
}

function goCreate() {
  pushBpmProcessCreate(router)
}

function goReCreate(row: any) {
  pushBpmProcessCreate(router, { processInstanceId: String(row.id) })
}

function openCancel(row: any, asAdmin: boolean) {
  cancelRow.value = row
  cancelAsAdmin.value = asAdmin
  cancelReason.value = ''
  cancelVisible.value = true
}

async function submitCancel() {
  if (!cancelReason.value.trim()) {
    message.warning('请输入取消原因')
    return false
  }
  if (!cancelRow.value?.id)
    return false
  cancelSubmitting.value = true
  try {
    if (cancelAsAdmin.value)
      await cancelProcessInstanceByAdmin(cancelRow.value.id, cancelReason.value)
    else
      await cancelProcessInstanceByStartUser(cancelRow.value.id, cancelReason.value)
    message.success('已取消')
    fetchList()
    return true
  }
  catch (e: any) {
    message.error(e?.message || '取消失败')
    return false
  }
  finally {
    cancelSubmitting.value = false
  }
}

async function loadFilterOptions() {
  try {
    const [categories, definitions] = await Promise.all([
      CategoryApi.getCategorySimpleList() as Promise<any[]>,
      getSimpleProcessDefinitionList() as Promise<any[]>,
    ])
    categoryOptions.value = (categories || []).map((c: any) => ({
      label: c.name,
      value: c.code,
    }))
    processDefinitionOptions.value = (definitions || []).map((d: any) => ({
      label: d.name,
      value: d.key,
    }))
  }
  catch {
    // ignore
  }
}

onMounted(loadFilterOptions)
</script>

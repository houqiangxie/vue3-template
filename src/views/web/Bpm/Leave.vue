<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    >
      <template #default>
        <n-space>
          <n-button v-if="hasPermission('bpm:oa-leave:create')" type="primary" @click="handleAdd">
            <template #icon>
              <n-icon size="14"><AddOutline /></n-icon>
            </template>
            发起请假
          </n-button>
          <n-button
            v-if="hasPermission('bpm:oa-leave:create')"
            secondary
            @click="goCreatePage"
          >
            独立发起页
          </n-button>
        </n-space>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      col-setting-key="bpm-leave"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.id as number"
      :loading="loading"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      :loading="submitting"
      @confirm="handleSubmit"
    />

    <n-modal
      v-model:show="cancelVisible"
      preset="dialog"
      title="取消请假"
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
import { AddOutline } from '@vicons/ionicons5'
import { createLeave, getLeave, getLeavePage, type LeaveVO } from '@/api/bpm/leave'
import { cancelProcessInstanceByStartUser } from '@/api/bpm/processInstance'
import { usePermission } from '@/hooks/usePermission'
import { buildBpmPageQuery, leaveTypeOptions, toBpmPageResult } from './constants'
import { pushBpmProcessDetail, resolveBpmRouteName } from './routeNames'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { BpmProcessInstanceStatus } from '@/utils/constants'

const { hasPermission } = usePermission()
const message = useMessage()
const router = useRouter()

const cancelVisible = ref(false)
const cancelSubmitting = ref(false)
const cancelReason = ref('')
const cancelRow = ref<any>(null)

const searchFields = defineFields([
  {
    key: 'type',
    label: '请假类型',
    component: 'NSelect',
    options: leaveTypeOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: false,
  },
  {
    key: 'reason',
    label: '原因',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
])

const leaveFields = defineFields([
  {
    key: 'type',
    label: '请假类型',
    component: 'NSelect',
    options: leaveTypeOptions,
    form: { required: true, defaultValue: 1 },
    search: false,
    table: { width: 100, format: 'option' },
  },
  {
    key: 'startTime',
    label: '开始时间',
    component: 'NDatePicker',
    bind: { type: 'datetime', clearable: true, valueFormat: 'yyyy-MM-dd HH:mm:ss' },
    form: { required: true },
    search: false,
    table: { width: 170 },
  },
  {
    key: 'endTime',
    label: '结束时间',
    component: 'NDatePicker',
    bind: { type: 'datetime', clearable: true, valueFormat: 'yyyy-MM-dd HH:mm:ss' },
    form: { required: true },
    search: false,
    table: { width: 170 },
  },
  {
    key: 'reason',
    label: '请假原因',
    component: 'NInput',
    bind: { type: 'textarea', rows: 3 },
    form: { required: true, span: 2 },
    search: false,
    table: { minWidth: 160, ellipsis: { tooltip: true } },
  },
  {
    key: 'status',
    label: '审批结果',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 110,
      render: (row: any) => getDictLabel(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, row.status),
    },
  },
  {
    key: 'processInstanceId',
    label: '流程编号',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 160, ellipsis: { tooltip: true } },
  },
  {
    key: 'createTime',
    label: '申请时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
  {
    key: 'actions',
    label: '操作',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 140,
      fixed: 'right',
      render: (row: any) => (
        <NSpace size={8}>
          <NButton
            text
            type="primary"
            disabled={!row.processInstanceId}
            onClick={() => goDetail(row)}
          >
            详情
          </NButton>
          {row.status === BpmProcessInstanceStatus.RUNNING && row.processInstanceId && (
            <NButton text type="error" onClick={() => openCancel(row)}>
              取消
            </NButton>
          )}
        </NSpace>
      ),
    },
  },
])

const {
  searchModel,
  tableData,
  total,
  loading,
  fetchList,
  handleSearch,
  onPageChange,
  onPageSizeChange,
  formVisible,
  formData,
  submitting,
  openCreate,
  withSubmit,
} = useCrud({
  fetcher: async query => toBpmPageResult(await getLeavePage(buildBpmPageQuery(query))),
  defaults: extractSearchDefaults(searchFields),
  formDefaults: () => extractFormDefaults(leaveFields),
})

const tableFields = computed(() => leaveFields.filter(f => f.table !== false))

const formModalConfig = computed(() => defineModal({
  title: '发起请假',
  width: 560,
  sections: [{
    type: 'form',
    key: 'main',
    fields: leaveFields.filter(f => f.form !== false),
    formProps: { cols: 2, labelWidth: 90 },
  }],
}))

function handleAdd() {
  openCreate({ type: 1 })
}

function goCreatePage() {
  const name = resolveBpmRouteName(router, 'Bpm-LeaveCreate', 'BpmLeaveCreate')
  if (router.hasRoute(name)) {
    router.push({ name })
    return
  }
  router.push({ path: '/Bpm/oa/leave/create' }).catch(() => {
    router.push({ path: '/oa/leave/create' })
  })
}

function goDetail(row: any) {
  if (!row.processInstanceId)
    return
  pushBpmProcessDetail(router, { id: String(row.processInstanceId) })
}

function openCancel(row: any) {
  cancelRow.value = row
  cancelReason.value = ''
  cancelVisible.value = true
}

async function submitCancel() {
  if (!cancelReason.value.trim()) {
    message.warning('请输入取消原因')
    return false
  }
  if (!cancelRow.value?.processInstanceId)
    return false
  cancelSubmitting.value = true
  try {
    await cancelProcessInstanceByStartUser(cancelRow.value.processInstanceId, cancelReason.value)
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

async function handleSubmit() {
  await withSubmit(async () => {
    const id = await createLeave(formData.value as unknown as LeaveVO)
    message.success('发起成功')
    await fetchList()
    try {
      const leave = await getLeave(String(id)) as any
      if (leave?.processInstanceId)
        await pushBpmProcessDetail(router, { id: String(leave.processInstanceId) })
    }
    catch {
      // 列表已刷新，跳转失败可手动点详情
    }
  })
}
</script>

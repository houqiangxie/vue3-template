<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    >
      <template #default>
        <n-select
          v-model:value="selectedDefinitionId"
          :options="definitionOptions"
          filterable
          clearable
          placeholder="选择流程定义"
          style="width: 260px"
          @update:value="onDefinitionChange"
        />
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      col-setting-key="bpm-process-report"
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
      title="取消流程"
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
import { useRoute, useRouter } from 'vue-router'
import { NButton, NSpace } from 'naive-ui'
import {
  cancelProcessInstanceByAdmin,
  getProcessInstanceManagerPage,
} from '@/api/bpm/processInstance'
import { getProcessDefinition, getProcessDefinitionList } from '@/api/bpm/definition'
import { getSimpleUserList } from '@/api/system/user'
import { parseFormFields } from '@/components/FormCreate/src/utils'
import { defineFields, extractSearchDefaults } from '@/utils/schema'
import { usePageList } from '@/hooks/usePageList'
import { pushBpmProcessDetail } from '@/views/web/Bpm/routeNames'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'Bpm-ProcessInstanceReport' })

const route = useRoute()
const router = useRouter()
const message = useMessage()

const selectedDefinitionId = ref<string | null>(null)
const processDefinitionKey = ref('')
const formFields = ref<Array<{ field: string, title: string, type?: string }>>([])
const definitionOptions = ref<Array<{ label: string, value: string }>>([])
const userOptions = ref<Array<{ label: string, value: number }>>([])

const cancelVisible = ref(false)
const cancelSubmitting = ref(false)
const cancelReason = ref('')
const cancelRow = ref<any>(null)

const statusOptions = [
  { label: '进行中', value: 1 },
  { label: '已通过', value: 2 },
  { label: '已拒绝', value: 3 },
  { label: '已取消', value: 4 },
]

const searchFields = computed(() => defineFields([
  {
    key: 'startUserId',
    label: '发起人',
    component: 'NSelect',
    options: userOptions.value,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: false,
  },
  {
    key: 'name',
    label: '流程名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
  {
    key: 'status',
    label: '流程状态',
    component: 'NSelect',
    options: statusOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: false,
  },
  ...formFields.value.map(f => ({
    key: `ff_${f.field}`,
    label: f.title,
    component: 'NInput' as const,
    search: { enabled: true },
    form: false as const,
    table: false as const,
  })),
]))

function toPage(data: unknown) {
  const raw = data as any
  const list = raw?.list ?? raw?.rows ?? []
  return {
    rows: (Array.isArray(list) ? list : []) as Record<string, unknown>[],
    total: Number(raw?.total ?? 0) || 0,
  }
}

const tableFields = computed(() => defineFields([
  {
    key: 'name',
    label: '流程名称',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 160, fixed: 'left' },
  },
  {
    key: 'startUserNickname',
    label: '流程发起人',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 120,
      render: (row: any) => row.startUser?.nickname || row.startUserNickname || '-',
    },
  },
  {
    key: 'status',
    label: '流程状态',
    component: 'NSelect',
    options: statusOptions,
    form: false,
    search: false,
    table: {
      width: 110,
      render: (row: any) => getDictLabel(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, row.status),
    },
  },
  {
    key: 'startTime',
    label: '发起时间',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 170,
      render: (row: any) => row.startTime || row.createTime || '-',
    },
  },
  {
    key: 'endTime',
    label: '结束时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
  ...formFields.value.map(f => ({
    key: f.field,
    label: f.title,
    component: 'NInput' as const,
    form: false as const,
    search: false as const,
    table: {
      width: 120,
      render: (row: any) => {
        const vars = row.formVariables || {}
        const val = vars[f.field]
        return val == null ? '' : String(val)
      },
    },
  })),
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
          <NButton text type="primary" onClick={() => goDetail(row)}>
            详情
          </NButton>
          {row.status === BpmProcessInstanceStatus.RUNNING && (
            <NButton text type="error" onClick={() => openCancel(row)}>
              取消
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
    if (!processDefinitionKey.value && !selectedDefinitionId.value) {
      return { rows: [], total: 0 }
    }
    const formFieldsParams: Record<string, unknown> = {}
    for (const f of formFields.value) {
      const v = query[`ff_${f.field}`]
      if (v != null && String(v).trim() !== '')
        formFieldsParams[f.field] = v
    }
    const { pageNum, pageSize, startUserId, name, status } = query
    const data = await getProcessInstanceManagerPage({
      pageNo: pageNum,
      pageSize,
      startUserId: startUserId || undefined,
      name: name || undefined,
      status: status ?? undefined,
      processDefinitionKey: processDefinitionKey.value || undefined,
      processDefinitionId: selectedDefinitionId.value || undefined,
      formFieldsParams: JSON.stringify(formFieldsParams),
    })
    return toPage(data)
  },
  defaults: extractSearchDefaults([]),
  immediate: false,
})

function parseDefinitionFields(rawFields?: Array<string | Record<string, any>>) {
  const result: Array<{ field: string, title: string, type?: string }> = []
  for (const item of rawFields || []) {
    try {
      const rule = typeof item === 'string' ? JSON.parse(item) : item
      parseFormFields(rule, result)
    }
    catch {
      // ignore
    }
  }
  return result
}

async function loadDefinition(id: string) {
  const def = await getProcessDefinition(id) as any
  if (!def) {
    message.error('流程定义不存在')
    return
  }
  processDefinitionKey.value = def.key || ''
  formFields.value = parseDefinitionFields(def.formFields)
  selectedDefinitionId.value = def.id
  await fetchList()
}

async function onDefinitionChange(id: string | null) {
  if (!id) {
    processDefinitionKey.value = ''
    formFields.value = []
    tableData.value = []
    total.value = 0
    return
  }
  await loadDefinition(id)
}

function goDetail(row: any) {
  pushBpmProcessDetail(router, { id: String(row.id) })
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
  if (!cancelRow.value?.id)
    return false
  cancelSubmitting.value = true
  try {
    await cancelProcessInstanceByAdmin(cancelRow.value.id, cancelReason.value)
    message.success('取消成功')
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

onMounted(async () => {
  try {
    const [defs, users] = await Promise.all([
      getProcessDefinitionList({ suspensionState: 1 }) as Promise<any[]>,
      getSimpleUserList(),
    ])
    definitionOptions.value = (defs || []).map((d: any) => ({
      label: `${d.name}${d.version != null ? ` (v${d.version})` : ''}`,
      value: d.id,
    }))
    userOptions.value = (users || []).map((u: any) => ({
      label: u.nickname || u.name || String(u.id),
      value: Number(u.id),
    }))
  }
  catch {
    // ignore
  }

  const qid = route.query.processDefinitionId
    ? String(route.query.processDefinitionId)
    : ''
  if (qid)
    await loadDefinition(qid)
  else if (definitionOptions.value[0])
    await loadDefinition(definitionOptions.value[0].value)
})
</script>

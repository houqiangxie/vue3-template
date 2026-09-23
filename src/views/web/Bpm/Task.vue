<template>
  <div>
    <n-tabs v-model:value="activeTab" type="line" @update:value="onTabChange">
      <n-tab-pane name="todo" tab="待办任务" />
      <n-tab-pane name="done" tab="已办任务" />
      <n-tab-pane name="manager" tab="任务管理" />
    </n-tabs>

    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    />

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      :col-setting-key="`bpm-task-${activeTab}`"
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
  </div>
</template>

<script setup lang="tsx">
import { useRouter } from 'vue-router'
import { NButton, NSpace, useDialog, useMessage } from 'naive-ui'
import {
  getTaskDonePage,
  getTaskManagerPage,
  getTaskTodoPage,
  withdrawTask,
} from '@/api/bpm/task'
import { CategoryApi } from '@/api/bpm/category'
import { getSimpleProcessDefinitionList } from '@/api/bpm/definition'
import { buildBpmPageQuery, toBpmPageResult } from './constants'
import { defineFields, extractSearchDefaults } from '@/utils/schema'
import { usePageList } from '@/hooks/usePageList'
import { pushBpmProcessDetail } from './routeNames'
import { formatDurationOrDash } from '@/utils/formatTime'
import { renderBpmSummary, resolveRowSummary } from './utils/listRender'

defineOptions({ name: 'Bpm-Task' })

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const activeTab = ref<'todo' | 'done' | 'manager'>('todo')

const categoryOptions = ref<{ label: string, value: string }[]>([])
const processDefinitionOptions = ref<{ label: string, value: string }[]>([])

const searchFields = computed(() => defineFields([
  {
    key: 'name',
    label: '任务名称',
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
    key: 'processInstanceName',
    label: '所属流程',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      minWidth: 160,
      render: (row: any) =>
        row.processInstanceName
        || row.processInstance?.name
        || '-',
    },
  },
  {
    key: 'summary',
    label: '摘要',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      minWidth: 180,
      render: (row: any) => renderBpmSummary(resolveRowSummary(row)),
    },
  },
  {
    key: 'startUserNickname',
    label: '发起人',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 110,
      render: (row: any) =>
        row.processInstance?.startUser?.nickname
        || row.startUserNickname
        || row.processInstance?.startUserNickname
        || '-',
    },
  },
  {
    key: 'name',
    label: '当前任务',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 140 },
  },
  {
    key: 'assigneeUserNickname',
    label: '处理人',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 120,
      render: (row: any) => row.assigneeUserNickname || row.assigneeUser?.nickname || '-',
    },
  },
  {
    key: 'createTime',
    label: '任务时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 180 },
  },
  {
    key: 'endTime',
    label: '完成时间',
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
      width: activeTab.value === 'done' ? 150 : 110,
      fixed: 'right',
      render: (row: any) => (
        <NSpace size={8}>
          <NButton text type="primary" onClick={() => goDetail(row)}>
            {activeTab.value === 'todo' ? '办理' : '详情'}
          </NButton>
          {activeTab.value === 'done' && (
            <NButton text type="warning" onClick={() => handleWithdraw(row)}>
              撤回
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
    let data: unknown
    if (activeTab.value === 'todo')
      data = await getTaskTodoPage(params)
    else if (activeTab.value === 'done')
      data = await getTaskDonePage(params)
    else
      data = await getTaskManagerPage(params)
    return toBpmPageResult(data as any)
  },
  defaults: extractSearchDefaults(searchFields.value),
})

function onTabChange() {
  fetchList()
}

function goDetail(row: any) {
  const processInstanceId = row.processInstanceId || row.processInstance?.id
  if (!processInstanceId) {
    message.warning('缺少流程实例编号')
    return
  }
  pushBpmProcessDetail(router, {
    id: String(processInstanceId),
    taskId: activeTab.value === 'todo' ? String(row.id) : undefined,
  })
}

function handleWithdraw(row: any) {
  dialog.warning({
    title: '撤回任务',
    content: `确认撤回任务「${row.name || row.id}」吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await withdrawTask(String(row.id))
        message.success('撤回成功')
        fetchList()
      }
      catch (e: any) {
        message.error(e?.message || '撤回失败')
      }
    },
  })
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

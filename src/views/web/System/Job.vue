<template>
  <div class="system-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="jobFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('monitor:job:add')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
        <n-button v-if="hasPermission('monitor:job:query')" @click="openJobLog">
          调度日志
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="system-page__table"
      flex-height
      col-setting-key="system-job"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :table-props="{ loading }"
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

    <CommonModal
      v-model:show="logVisible"
      title="调度日志"
      :width="900"
      :show-footer="false"
    >
      <div class="job-log-toolbar">
        <n-button v-if="hasPermission('monitor:job:remove')" type="error" size="small" @click="handleCleanLog">
          清空
        </n-button>
      </div>
      <CommonTable
        col-setting-key="system-job-log"
        :data="logTable"
        :fields="logFields"
        :page="logSearch.pageNum as number"
        :page-size="logSearch.pageSize as number"
        :item-count="logTotal"
        :table-props="{ loading: logLoading, maxHeight: 420 }"
        @update:page="onLogPageChange"
        @update:page-size="onLogPageSizeChange"
      />
    </CommonModal>
  </div>
</template>

<script setup lang="tsx">
import { AddOutline } from '@vicons/ionicons5'
import {
  addJob,
  changeJobStatus,
  cleanJobLog,
  deleteJob,
  listJob,
  listJobLog,
  runJob,
  updateJob,
} from '@/api/system/job'
import type { SysJob } from '@/api/system/types'
import {
  concurrentOptions,
  jobGroupOptions,
  jobStatusOptions,
  loginStatusOptions,
  misfirePolicyOptions,
} from './constants'
import { usePermission } from '@/hooks/usePermission'

const { confirmDanger } = useConfirm()
const { hasPermission } = usePermission()

const jobFields = defineFields([
  {
    key: 'jobName',
    label: '任务名称',
    component: 'NInput',
    search: { enabled: true },
    form: { required: true },
    table: { width: 150 },
  },
  {
    key: 'jobGroup',
    label: '任务组名',
    component: 'NSelect',
    options: jobGroupOptions,
    form: { required: true, defaultValue: 'DEFAULT' },
    search: { enabled: true, defaultValue: null },
    table: {
      width: 100,
      format: 'option',
    },
  },
  {
    key: 'invokeTarget',
    label: '调用目标',
    component: 'NInput',
    form: { required: true, span: 2 },
    search: false,
    table: { minWidth: 200, ellipsis: true },
  },
  {
    key: 'cronExpression',
    label: 'cron 表达式',
    component: 'CronInput',
    form: {
      required: true,
      span: 2,
    },
    search: false,
    table: { width: 150 },
  },
  {
    key: 'misfirePolicy',
    label: '执行策略',
    component: 'NSelect',
    options: misfirePolicyOptions,
    form: { defaultValue: '1' },
    search: false,
    table: false,
  },
  {
    key: 'concurrent',
    label: '是否并发',
    component: 'NSelect',
    options: concurrentOptions,
    form: { defaultValue: '1' },
    search: false,
    table: false,
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: jobStatusOptions,
    form: { required: true, defaultValue: '1' },
    search: { enabled: true, defaultValue: null },
    table: {
      width: 80,
      format: 'option',
      tagType: val => (val === '1' ? 'success' : 'warning'),
    },
  },
  {
    key: 'remark',
    label: '备注',
    component: 'NInput',
    bind: { type: 'textarea' },
    form: { span: 2 },
    search: false,
    table: false,
  },
  {
    key: 'createTime',
    label: '创建时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
])

const logFields = defineFields([
  {
    key: 'jobName',
    label: '任务名称',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 140 },
  },
  {
    key: 'jobGroup',
    label: '任务组名',
    component: 'NSelect',
    options: jobGroupOptions,
    form: false,
    search: false,
    table: { width: 100, format: 'option' },
  },
  {
    key: 'invokeTarget',
    label: '调用目标',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 180, ellipsis: true },
  },
  {
    key: 'jobMessage',
    label: '日志信息',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 160, ellipsis: true },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: loginStatusOptions,
    form: false,
    search: false,
    table: {
      width: 80,
      format: 'option',
      tagType: val => (val === '1' ? 'success' : 'error'),
    },
  },
  {
    key: 'createTime',
    label: '执行时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
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
  isEdit,
  submitting,
  openCreate,
  openEdit,
  submitCreateOrUpdate,
  removeAndRefresh,
} = useCrud({
  fetcher: async q => toPageResult(await listJob(q)),
  defaults: extractSearchDefaults(jobFields),
  formDefaults: () => extractFormDefaults(jobFields),
})

const logVisible = ref(false)

const {
  searchModel: logSearch,
  tableData: logTable,
  total: logTotal,
  loading: logLoading,
  fetchList: fetchLogList,
  handleReset: resetLogList,
  onPageChange: onLogPageChange,
  onPageSizeChange: onLogPageSizeChange,
} = usePageList({
  fetcher: async q => toPageResult(await listJobLog(q)),
  immediate: false,
})

const tableFields = computed(() => [
  ...jobFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 260,
      fixed: 'right' as const,
      actions: (row) => {
        const job = row as unknown as SysJob
        return [
          {
            key: 'edit',
            label: '修改',
            type: 'primary' as const,
            permission: 'monitor:job:edit',
            onClick: (r) => openEdit(r as unknown as SysJob),
          },
          {
            key: 'changeStatus',
            label: job.status === '1' ? '暂停' : '启用',
            type: 'warning' as const,
            permission: 'monitor:job:changeStatus',
            onClick: (r) => handleChangeStatus(r as unknown as SysJob),
          },
          {
            key: 'run',
            label: '执行',
            type: 'info' as const,
            permission: 'monitor:job:changeStatus',
            onClick: (r) => handleRun(r as unknown as SysJob),
          },
          {
            key: 'delete',
            label: '删除',
            type: 'error' as const,
            permission: 'monitor:job:remove',
            popconfirm: (r) => `是否确认删除任务「${(r as unknown as SysJob).jobName}」？`,
            onClick: async (r) => {
              await removeAndRefresh(() => deleteJob([(r as unknown as SysJob).jobId]))
            },
          },
        ]
      },
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改定时任务' : '新增定时任务',
  width: 720,
  sections: [{
    type: 'form',
    key: 'main',
    fields: jobFields,
    formProps: { cols: 2, labelWidth: 100 },
  }],
}))

function handleAdd() {
  openCreate({
    jobGroup: 'DEFAULT',
    misfirePolicy: '1',
    concurrent: '1',
    status: '1',
  })
}

function handleChangeStatus(row: SysJob) {
  const next = row.status === '1' ? '0' : '1'
  const action = next === '1' ? '启用' : '暂停'
  confirmDanger({
    title: `确认${action}`,
    content: `是否确认${action}任务「${row.jobName}」？`,
    successMessage: `${action}成功`,
    action: async () => {
      await changeJobStatus(row.jobId, next)
      await fetchList()
    },
  })
}

function handleRun(row: SysJob) {
  confirmDanger({
    title: '确认执行',
    content: `是否确认立即执行一次任务「${row.jobName}」？`,
    successMessage: '执行指令已发送',
    action: async () => {
      await runJob(row.jobId, row.jobGroup)
    },
  })
}

async function handleSubmit() {
  await submitCreateOrUpdate(addJob, updateJob)
}

async function openJobLog() {
  logVisible.value = true
  await resetLogList()
}

function handleCleanLog() {
  confirmDanger({
    title: '确认清空',
    content: '是否确认清空所有调度日志？',
    successMessage: '清空成功',
    action: async () => {
      await cleanJobLog()
      await fetchLogList()
    },
  })
}
</script>

<style scoped>
.job-log-toolbar {
  margin-bottom: 12px;
}
</style>

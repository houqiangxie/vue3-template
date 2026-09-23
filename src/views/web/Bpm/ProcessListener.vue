<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="listenerFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('bpm:process-listener:create')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      col-setting-key="bpm-process-listener"
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
  </div>
</template>

<script setup lang="tsx">
import { AddOutline } from '@vicons/ionicons5'
import { ProcessListenerApi, type ProcessListenerVO } from '@/api/bpm/processListener'
import { usePermission } from '@/hooks/usePermission'
import {
  bpmStatusOptions,
  buildBpmPageQuery,
  processListenerEventOptions,
  processListenerTypeOptions,
  processListenerValueTypeOptions,
  toBpmPageResult,
} from './constants'

const { hasPermission } = usePermission()

const listenerFields = defineFields([
  {
    key: 'name',
    label: '名字',
    component: 'NInput',
    search: { enabled: true },
    form: { required: true },
    table: { minWidth: 140 },
  },
  {
    key: 'type',
    label: '类型',
    component: 'NSelect',
    options: processListenerTypeOptions,
    form: { required: true, defaultValue: 'execution' },
    search: { enabled: true, defaultValue: null },
    table: { width: 120, format: 'option' },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: bpmStatusOptions,
    form: { required: true, defaultValue: 0 },
    search: { enabled: true, defaultValue: null },
    table: {
      width: 90,
      format: 'option',
      tagType: val => (val === 0 ? 'success' : 'error'),
    },
  },
  {
    key: 'event',
    label: '事件',
    component: 'NSelect',
    options: processListenerEventOptions,
    form: { required: true, defaultValue: 'start' },
    search: { enabled: true },
    table: { width: 110 },
  },
  {
    key: 'valueType',
    label: '值类型',
    component: 'NSelect',
    options: processListenerValueTypeOptions,
    form: { required: true, defaultValue: 'class' },
    search: false,
    table: { width: 120, format: 'option' },
  },
  {
    key: 'value',
    label: '值',
    component: 'NInput',
    bind: { type: 'textarea', rows: 3 },
    form: { required: true, span: 2 },
    search: false,
    table: { minWidth: 180, ellipsis: { tooltip: true } },
  },
])

const {
  searchModel,
  tableData,
  total,
  loading,
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
  fetcher: async query =>
    toBpmPageResult(await ProcessListenerApi.getProcessListenerPage(buildBpmPageQuery(query))),
  defaults: extractSearchDefaults(listenerFields),
  formDefaults: () => extractFormDefaults(listenerFields),
})

const tableFields = computed(() => [
  ...listenerFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 140,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'edit',
          label: '修改',
          type: 'primary',
          permission: 'bpm:process-listener:update',
          onClick: (r) => openEdit(r as unknown as ProcessListenerVO),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'bpm:process-listener:delete',
          popconfirm: (r) => `是否确认删除监听器「${(r as unknown as ProcessListenerVO).name}」？`,
          onClick: async (r) => {
            await removeAndRefresh(() =>
              ProcessListenerApi.deleteProcessListener((r as unknown as ProcessListenerVO).id),
            )
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改流程监听器' : '新增流程监听器',
  width: 600,
  sections: [{
    type: 'form',
    key: 'main',
    fields: listenerFields,
    formProps: { cols: 2, labelWidth: 90 },
  }],
}))

function handleAdd() {
  openCreate({
    type: 'execution',
    status: 0,
    event: 'start',
    valueType: 'class',
  })
}

async function handleSubmit() {
  await submitCreateOrUpdate(
    ProcessListenerApi.createProcessListener,
    ProcessListenerApi.updateProcessListener,
  )
}
</script>

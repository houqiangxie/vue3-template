<template>
  <div class="system-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('system:config:add')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
        <n-button
          v-if="hasPermission('system:config:remove')"
          type="error"
          secondary
          :disabled="!checkedIds.length"
          @click="handleBatchDelete"
        >
          删除
        </n-button>
        <n-button v-if="hasPermission('system:config:remove')" @click="handleRefreshCache">
          刷新缓存
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="system-page__table"
      flex-height
      selectable
      col-setting-key="system-config"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.configId as number"
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
import { addConfig, deleteConfig, listConfig, refreshConfigCache, updateConfig } from '@/api/system/config'
import type { SysConfig } from '@/api/system/types'
import { configTypeOptions } from './constants'
import { usePermission } from '@/hooks/usePermission'

const { hasPermission } = usePermission()
const { message, confirmBatchDelete } = useConfirm()
const checkedIds = ref<Array<string | number>>([])

const searchFields = defineFields([
  {
    key: 'configName',
    label: '参数名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
  {
    key: 'configKey',
    label: '参数键名',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
  {
    key: 'configType',
    label: '系统内置',
    component: 'NSelect',
    options: configTypeOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: false,
  },
  {
    key: 'dateRange',
    label: '创建时间',
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
])

const configFields = defineFields([
  {
    key: 'configName',
    label: '参数名称',
    component: 'NInput',
    form: { required: true, span: 2 },
    search: false,
    table: { minWidth: 160 },
  },
  {
    key: 'configKey',
    label: '参数键名',
    component: 'NInput',
    form: { required: true, span: 2 },
    search: false,
    table: { minWidth: 180 },
  },
  {
    key: 'configValue',
    label: '参数键值',
    component: 'NInput',
    form: { required: true, span: 2 },
    search: false,
    table: { minWidth: 140 },
  },
  {
    key: 'configType',
    label: '系统内置',
    component: 'NRadioGroup',
    options: configTypeOptions,
    form: { required: true, defaultValue: 'N' },
    search: false,
    table: {
      width: 100,
      format: 'option',
      tagType: val => (val === 'Y' ? 'warning' : 'default'),
    },
  },
  {
    key: 'createTime',
    label: '创建时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
  {
    key: 'remark',
    label: '备注',
    component: 'NInput',
    bind: { type: 'textarea', rows: 3 },
    form: { span: 2 },
    search: false,
    table: false,
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
  fetcher: async query => toPageResult(await listConfig(query)),
  defaults: extractSearchDefaults(searchFields),
  buildQuery: splitDateRange,
  formDefaults: () => extractFormDefaults(configFields),
})

const tableFields = computed(() => [
  ...configFields.filter(f => f.table !== false),
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
          permission: 'system:config:edit',
          onClick: (r) => openEdit(r as unknown as SysConfig),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'system:config:remove',
          popconfirm: (r) => `是否确认删除参数「${(r as unknown as SysConfig).configName}」？`,
          onClick: async (r) => {
            await removeAndRefresh(() => deleteConfig([(r as unknown as SysConfig).configId]))
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改参数' : '新增参数',
  width: 560,
  sections: [{
    type: 'form',
    key: 'main',
    fields: configFields,
    formProps: { cols: 2, labelWidth: 90 },
  }],
}))

function handleAdd() {
  openCreate({ configType: 'N' })
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '参数',
    action: () => deleteConfig(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

async function handleRefreshCache() {
  await refreshConfigCache()
  message.success('刷新缓存成功')
}

async function handleSubmit() {
  await submitCreateOrUpdate(addConfig, updateConfig)
}
</script>

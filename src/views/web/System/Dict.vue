<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('system:dict:add')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
        <n-button
          v-if="hasPermission('system:dict:remove')"
          type="error"
          secondary
          :disabled="!checkedIds.length"
          @click="handleBatchDelete"
        >
          删除
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      selectable
      col-setting-key="system-dict"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.dictId as number"
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
import { NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import {
  addDictType,
  deleteDictType,
  listDictType,
  updateDictType,
} from '@/api/system/dict'
import type { SysDictType } from '@/api/system/types'
import { statusOptions } from './constants'
import { usePermission } from '@/hooks/usePermission'

const router = useRouter()
const { hasPermission } = usePermission()
const { confirmBatchDelete } = useConfirm()
const checkedIds = ref<Array<string | number>>([])

const searchFields = defineFields([
  {
    key: 'dictName',
    label: '字典名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
  {
    key: 'dictType',
    label: '字典类型',
    component: 'NInput',
    search: { enabled: true },
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

const dictFields = defineFields([
  {
    key: 'dictName',
    label: '字典名称',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: { width: 160 },
  },
  {
    key: 'dictType',
    label: '字典类型',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: {
      width: 200,
      render: (row: Record<string, unknown>) => (
        <NButton
          text
          type="primary"
          onClick={() => openDictData(row as unknown as SysDictType)}
        >
          {String(row.dictType ?? '')}
        </NButton>
      ),
    },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NRadioGroup',
    options: statusOptions,
    form: { required: true, defaultValue: '1' },
    search: false,
    table: {
      width: 80,
      format: 'option',
      tagType: val => (val === '1' ? 'success' : 'error'),
    },
  },
  {
    key: 'remark',
    label: '备注',
    component: 'NInput',
    bind: { type: 'textarea', rows: 3 },
    form: { span: 2 },
    search: false,
    table: { ellipsis: { tooltip: true } },
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

const tableFields = computed(() => [
  ...dictFields.filter(f => f.table !== false),
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 220,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'edit',
          label: '修改',
          type: 'primary',
          permission: 'system:dict:edit',
          onClick: (r) => openEdit(r as unknown as SysDictType),
        },
        {
          key: 'dictData',
          label: '字典数据',
          type: 'info',
          permission: 'system:dict:list',
          onClick: (r) => openDictData(r as unknown as SysDictType),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'system:dict:remove',
          popconfirm: (r) => `是否确认删除字典「${(r as unknown as SysDictType).dictName}」？`,
          onClick: async (r) => {
            await removeAndRefresh(() => deleteDictType([(r as unknown as SysDictType).dictId]))
          },
        },
      ],
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
  isEdit,
  submitting,
  openCreate,
  openEdit,
  submitCreateOrUpdate,
  removeAndRefresh,
} = useCrud({
  fetcher: async query => toPageResult(await listDictType(query)),
  defaults: extractSearchDefaults(searchFields),
  buildQuery: splitDateRange,
  formDefaults: () => extractFormDefaults(dictFields),
})

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改字典类型' : '新增字典类型',
  width: 560,
  sections: [{
    type: 'form',
    key: 'main',
    fields: dictFields,
    formProps: { cols: 1, labelWidth: 90 },
  }],
}))

function handleAdd() {
  openCreate({ status: '1' })
}

function openDictData(row: SysDictType) {
  router.push({
    name: 'System-DictData',
    query: {
      dictId: String(row.dictId),
      dictType: row.dictType,
    },
  })
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '字典类型',
    action: () => deleteDictType(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

async function handleSubmit() {
  await submitCreateOrUpdate(addDictType, updateDictType)
}
</script>

<template>
  <div class="system-page">
    <div class="system-page__sub-header">
      <n-button quaternary @click="goBack">
        <template #icon>
          <n-icon size="16"><ArrowBackOutline /></n-icon>
        </template>
        返回
      </n-button>
      <span class="system-page__sub-header-title">
        字典数据
        <template v-if="dictName"> - {{ dictName }}</template>
        <template v-else-if="currentDictType"> - {{ currentDictType }}</template>
      </span>
    </div>

    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="onSearch"
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
      class="system-page__table"
      flex-height
      selectable
      col-setting-key="system-dict-data"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.dictCode as number"
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
  </div>
</template>

<script setup lang="tsx">
import { AddOutline, ArrowBackOutline } from '@vicons/ionicons5'
import { useRoute, useRouter } from 'vue-router'
import {
  addDictData,
  deleteDictData,
  getDictType,
  listDictData,
  listDictType,
  updateDictData,
} from '@/api/system/dict'
import type { SysDictData, SysDictType } from '@/api/system/types'
import { statusOptions } from './constants'
import { usePermission } from '@/hooks/usePermission'

const route = useRoute()
const router = useRouter()
const { hasPermission } = usePermission()
const { message, confirmBatchDelete } = useConfirm()
const checkedIds = ref<Array<string | number>>([])

const dictId = computed(() => Number(route.query.dictId || 0))
const currentDictType = ref(String(route.query.dictType || ''))
const dictName = ref('')
const typeOptions = ref<{ label: string, value: string }[]>([])

const searchFields = computed(() => defineFields([
  {
    key: 'dictType',
    label: '字典名称',
    component: 'NSelect',
    options: typeOptions.value,
    search: { enabled: true, defaultValue: currentDictType.value || null },
    form: false,
    table: false,
  },
  {
    key: 'dictLabel',
    label: '字典标签',
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
]))

const dataFields = defineFields([
  {
    key: 'dictLabel',
    label: '数据标签',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: { width: 140 },
  },
  {
    key: 'dictValue',
    label: '数据键值',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: { width: 140 },
  },
  {
    key: 'dictSort',
    label: '显示排序',
    component: 'NInputNumber',
    form: { required: true, defaultValue: 0 },
    search: false,
    table: { width: 100, align: 'center' },
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
  ...dataFields.filter(f => f.table !== false),
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
          permission: 'system:dict:edit',
          onClick: (r) => openEdit(r as unknown as SysDictData),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'system:dict:remove',
          popconfirm: (r) => `是否确认删除字典数据「${(r as unknown as SysDictData).dictLabel}」？`,
          onClick: async (r) => {
            await removeAndRefresh(() => deleteDictData([(r as unknown as SysDictData).dictCode]))
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
  fetcher: async (query) => {
    const { pageNum, pageSize, dictType, dictLabel, status } = query
    const params: Record<string, unknown> = { pageNum, pageSize, dictType }
    if (dictLabel)
      params.dictLabel = dictLabel
    if (status !== null && status !== undefined && status !== '')
      params.status = status
    const res = await listDictData(params)
    if (dictType)
      currentDictType.value = String(dictType)
    return toPageResult(res)
  },
  defaults: {
    dictType: currentDictType.value,
    dictLabel: '',
    status: null as string | null,
  },
  formDefaults: () => extractFormDefaults(dataFields),
  immediate: false,
})

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改字典数据' : '新增字典数据',
  width: 560,
  sections: [{
    type: 'form',
    key: 'main',
    fields: dataFields,
    formProps: { cols: 1, labelWidth: 90 },
  }],
}))

onMounted(async () => {
  await Promise.all([loadTypeOptions(), loadDictMeta()])
  if (!searchModel.value.dictType && currentDictType.value)
    searchModel.value.dictType = currentDictType.value
  await fetchList()
})

watch(
  () => [route.query.dictId, route.query.dictType],
  async () => {
    currentDictType.value = String(route.query.dictType || '')
    searchModel.value.dictType = currentDictType.value
    searchModel.value.pageNum = 1
    await loadDictMeta()
    await fetchList()
  },
)

async function loadTypeOptions() {
  const { data } = await listDictType({ pageNum: 1, pageSize: 200 })
  typeOptions.value = ((data?.rows ?? []) as SysDictType[]).map(item => ({
    label: item.dictName,
    value: item.dictType,
  }))
}

async function loadDictMeta() {
  if (dictId.value) {
    try {
      const { data: detail } = await getDictType(dictId.value)
      dictName.value = detail?.dictName ?? ''
      currentDictType.value = detail?.dictType ?? ''
      searchModel.value.dictType = detail?.dictType ?? ''
      return
    }
    catch {
      // fallback to query
    }
  }
  const matched = typeOptions.value.find(item => item.value === currentDictType.value)
  dictName.value = matched?.label || ''
}

function goBack() {
  router.push({ name: 'System-Dict' })
}

function onSearch() {
  if (searchModel.value.dictType)
    currentDictType.value = String(searchModel.value.dictType)
  const matched = typeOptions.value.find(item => item.value === currentDictType.value)
  dictName.value = matched?.label || dictName.value
  handleSearch()
}

function handleAdd() {
  if (!currentDictType.value) {
    message.warning('请先选择字典类型')
    return
  }
  openCreate({
    dictType: currentDictType.value,
    status: '1',
    dictSort: 0,
  })
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '字典数据',
    action: () => deleteDictData(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

async function handleSubmit() {
  await submitCreateOrUpdate(addDictData, updateDictData, {
    payload: {
      ...formData.value,
      dictType: currentDictType.value,
    },
  })
}
</script>

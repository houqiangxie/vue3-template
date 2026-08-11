<template>
  <div class="system-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="deptSearchFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('system:dept:add')" type="primary" @click="handleAdd()">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="system-page__table"
      flex-height
      col-setting-key="system-dept"
      :data="tableData"
      :fields="tableFields"
      :show-pagination="false"
      :row-key="(row: Record<string, unknown>) => row.deptId as number"
      :table-props="{ loading, defaultExpandAll: true }"
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
import { useMessage } from 'naive-ui'
import SearchPanel from '@/components/common/SearchPanel.vue'
import CommonTable from '@/components/common/table/CommonTable.vue'
import CommonModal from '@/components/common/modal/CommonModal.vue'
import { defineFields, extractFormDefaults, extractSearchDefaults } from '@/components/common/table/fieldSchema'
import { defineModal } from '@/components/common/modal/modalSchema'
import {
  addDept,
  deleteDept,
  deptToTreeOptions,
  listDept,
  listDeptFlat,
  updateDept,
} from '@/api/system/dept'
import type { SysDept } from '@/api/system/types'
import { statusOptions } from './constants'

const message = useMessage()
const { hasPermission } = usePermission()

const parentDeptOptions = ref<{ label: string, key: number, children?: unknown[] }[]>([])

const deptSearchFields = defineFields([
  {
    key: 'deptName',
    label: '部门名称',
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
])

const deptFormFields = computed(() => defineFields([
  {
    key: 'parentId',
    label: '上级部门',
    component: 'NTreeSelect',
    options: [{ label: '主类目', key: 0 }, ...parentDeptOptions.value],
    form: { required: true, defaultValue: 0 },
    search: false,
    table: false,
  },
  {
    key: 'deptName',
    label: '部门名称',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: false,
  },
  {
    key: 'orderNum',
    label: '显示排序',
    component: 'NInputNumber',
    form: { required: true, defaultValue: 0 },
    search: false,
    table: false,
  },
  {
    key: 'leader',
    label: '负责人',
    component: 'NInput',
    form: {},
    search: false,
    table: false,
  },
  {
    key: 'phone',
    label: '联系电话',
    component: 'NInput',
    bind: { patternType: 'phone' },
    form: {},
    search: false,
    table: false,
  },
  {
    key: 'email',
    label: '邮箱',
    component: 'NInput',
    form: {},
    search: false,
    table: false,
  },
  {
    key: 'status',
    label: '状态',
    component: 'NRadioGroup',
    options: statusOptions,
    form: { required: true, defaultValue: '1' },
    search: false,
    table: false,
  },
]))

const deptTableFields = defineFields([
  {
    key: 'deptName',
    label: '部门名称',
    table: { width: 200 },
    form: false,
    search: false,
  },
  {
    key: 'orderNum',
    label: '排序',
    table: { width: 80, align: 'center' },
    form: false,
    search: false,
  },
  {
    key: 'leader',
    label: '负责人',
    table: { width: 120 },
    form: false,
    search: false,
  },
  {
    key: 'phone',
    label: '联系电话',
    table: { width: 130 },
    form: false,
    search: false,
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: statusOptions,
    table: {
      width: 90,
      format: 'option',
      tagType: val => (val === '1' ? 'success' : 'error'),
    },
    form: false,
    search: false,
  },
  {
    key: 'createTime',
    label: '创建时间',
    table: { width: 170 },
    form: false,
    search: false,
  },
])

const {
  searchModel,
  tableData,
  loading,
  fetchList,
  handleSearch,
  formVisible,
  formData,
  isEdit,
  submitting,
  openCreate,
  openEdit,
  submitCreateOrUpdate,
  removeAndRefresh,
} = useCrud({
  mode: 'tree',
  fetcher: async () => {
    const { data } = await listDept()
    return (data ?? []) as unknown as Record<string, unknown>[]
  },
  defaults: extractSearchDefaults(deptSearchFields),
  filter: (data, model) => {
    let result = data as unknown as SysDept[]
    if (model.deptName)
      result = filterTreeByKeyword(result as unknown as Record<string, unknown>[], String(model.deptName), 'deptName') as unknown as SysDept[]
    if (model.status != null && model.status !== '')
      result = filterTreeByStatus(result as unknown as Record<string, unknown>[], String(model.status)) as unknown as SysDept[]
    return result as unknown as Record<string, unknown>[]
  },
  formDefaults: () => extractFormDefaults(deptFormFields.value),
  immediate: false,
})

const tableFields = computed(() => [
  ...deptTableFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 200,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'edit',
          label: '修改',
          type: 'primary',
          permission: 'system:dept:edit',
          onClick: (r) => openEdit(r as unknown as SysDept),
        },
        {
          key: 'add',
          label: '新增',
          type: 'info',
          permission: 'system:dept:add',
          onClick: (r) => handleAdd(r as unknown as SysDept),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'system:dept:remove',
          show: (r) => (r as unknown as SysDept).parentId !== 0,
          popconfirm: (r) => `是否确认删除部门「${(r as unknown as SysDept).deptName}」？`,
          onClick: async (r) => {
            try {
              await removeAndRefresh(async () => {
                await deleteDept((r as unknown as SysDept).deptId)
                await refreshParentOptions()
              })
            }
            catch (e) {
              if (!(e instanceof ApiError && e.shown))
                message.error((e as Error).message)
            }
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改部门' : '新增部门',
  width: 640,
  sections: [{
    type: 'form',
    key: 'main',
    fields: deptFormFields.value,
    formProps: { cols: 2, labelWidth: 90 },
  }],
}))

onMounted(() => {
  refreshParentOptions()
  fetchList()
})

async function refreshParentOptions() {
  const flat = await listDeptFlat()
  parentDeptOptions.value = deptToTreeOptions(flat)
}

function handleAdd(parent?: SysDept) {
  openCreate({
    parentId: parent?.deptId ?? 0,
    status: '1',
    orderNum: 0,
  })
}

async function handleSubmit() {
  await submitCreateOrUpdate(addDept, updateDept, {
    beforeFetch: refreshParentOptions,
  })
}
</script>

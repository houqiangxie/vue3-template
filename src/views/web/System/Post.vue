<template>
  <div class="system-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="postFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('system:post:add')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
        <n-button
          v-if="hasPermission('system:post:remove')"
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
      col-setting-key="system-post"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.postId as number"
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
import { AddOutline } from '@vicons/ionicons5'
import SearchPanel from '@/components/common/SearchPanel.vue'
import CommonTable from '@/components/common/table/CommonTable.vue'
import CommonModal from '@/components/common/modal/CommonModal.vue'
import { defineFields, extractFormDefaults, extractSearchDefaults } from '@/components/common/table/fieldSchema'
import { defineModal } from '@/components/common/modal/modalSchema'
import { addPost, deletePost, listPost, updatePost } from '@/api/system/post'
import type { SysPost } from '@/api/system/types'
import { statusOptions } from './constants'

const { hasPermission } = usePermission()
const { confirmBatchDelete } = useConfirm()
const checkedIds = ref<Array<string | number>>([])

const postFields = defineFields([
  {
    key: 'postCode',
    label: '岗位编码',
    component: 'NInput',
    search: { enabled: true },
    form: { required: true },
    table: { width: 120 },
  },
  {
    key: 'postName',
    label: '岗位名称',
    component: 'NInput',
    search: { enabled: true },
    form: { required: true },
    table: { minWidth: 140 },
  },
  {
    key: 'postSort',
    label: '显示顺序',
    component: 'NInputNumber',
    bind: { min: 0 },
    form: { required: true, defaultValue: 0 },
    search: false,
    table: { width: 100 },
  },
  {
    key: 'status',
    label: '状�?,
    component: 'NSelect',
    options: statusOptions,
    form: { required: true, defaultValue: '1' },
    search: { enabled: true, defaultValue: null },
    table: {
      width: 80,
      format: 'option',
      tagType: val => (val === '1' ? 'success' : 'error'),
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
  fetcher: async query => toPageResult(await listPost(query)),
  defaults: extractSearchDefaults(postFields),
  formDefaults: () => extractFormDefaults(postFields),
})

const tableFields = computed(() => [
  ...postFields,
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
          permission: 'system:post:edit',
          onClick: (r) => openEdit(r as unknown as SysPost),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'system:post:remove',
          popconfirm: (r) => `是否确认删除岗位�?{(r as unknown as SysPost).postName}」？`,
          onClick: async (r) => {
            await removeAndRefresh(() => deletePost([(r as unknown as SysPost).postId]))
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改岗位' : '新增岗位',
  width: 560,
  sections: [{
    type: 'form',
    key: 'main',
    fields: postFields,
    formProps: { cols: 2, labelWidth: 90 },
  }],
}))

function handleAdd() {
  openCreate({ postSort: 0, status: '1' })
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '岗位',
    action: () => deletePost(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

async function handleSubmit() {
  await submitCreateOrUpdate(addPost, updatePost)
}
</script>

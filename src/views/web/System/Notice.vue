<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="noticeFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('system:notice:add')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
        <n-button
          v-if="hasPermission('system:notice:remove')"
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
      selectable
      col-setting-key="system-notice"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.noticeId as number"
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
import { addNotice, deleteNotice, listNotice, updateNotice } from '@/api/system/notice'
import type { SysNotice } from '@/api/system/types'
import { noticeTypeOptions, statusOptions } from './constants'
import { usePermission } from '@/hooks/usePermission'

const { hasPermission } = usePermission()
const { confirmBatchDelete } = useConfirm()
const checkedIds = ref<Array<string | number>>([])

const noticeFields = defineFields([
  {
    key: 'noticeTitle',
    label: '公告标题',
    component: 'NInput',
    search: { enabled: true },
    form: { required: true, span: 2 },
    table: { minWidth: 180 },
  },
  {
    key: 'noticeType',
    label: '公告类型',
    component: 'NSelect',
    options: noticeTypeOptions,
    form: { required: true, defaultValue: '1' },
    search: { enabled: true, defaultValue: null },
    table: {
      width: 100,
      format: 'option',
      tagType: val => (val === '1' ? 'warning' : 'success'),
    },
  },
  {
    key: 'status',
    label: '状态',
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
    key: 'createBy',
    label: '创建者',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 100 },
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
    key: 'noticeContent',
    label: '内容',
    component: 'Editor',
    bind: { height: 280, placeholder: '请输入公告内容' },
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
  fetcher: async query => toPageResult(await listNotice(query)),
  defaults: extractSearchDefaults(noticeFields),
  formDefaults: () => extractFormDefaults(noticeFields),
})

const tableFields = computed(() => [
  ...noticeFields,
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
          permission: 'system:notice:edit',
          onClick: (r) => openEdit(r as unknown as SysNotice),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'system:notice:remove',
          popconfirm: (r) => `是否确认删除公告「${(r as unknown as SysNotice).noticeTitle}」？`,
          onClick: async (r) => {
            await removeAndRefresh(() => deleteNotice([(r as unknown as SysNotice).noticeId]))
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改通知公告' : '新增通知公告',
  width: 860,
  sections: [{
    type: 'form',
    key: 'main',
    fields: noticeFields,
    formProps: { cols: 2, labelWidth: 90 },
  }],
}))

function handleAdd() {
  openCreate({ noticeType: '1', status: '1' })
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '公告',
    action: () => deleteNotice(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

async function handleSubmit() {
  await submitCreateOrUpdate(addNotice, updateNotice)
}
</script>

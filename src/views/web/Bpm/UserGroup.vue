<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="groupFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('bpm:user-group:create')" type="primary" @click="handleAdd">
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
      col-setting-key="bpm-user-group"
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
import {
  createUserGroup,
  deleteUserGroup,
  getUserGroupPage,
  updateUserGroup,
  type UserGroupVO,
} from '@/api/bpm/userGroup'
import { listUser } from '@/api/system/user'
import { usePermission } from '@/hooks/usePermission'
import { bpmStatusOptions, buildBpmPageQuery, toBpmPageResult } from './constants'

const { hasPermission } = usePermission()

const userOptions = ref<{ label: string; value: number }[]>([])

onMounted(async () => {
  const res = await listUser({ pageNum: 1, pageSize: 500, status: '1' })
  userOptions.value = (res.data?.rows ?? []).map(u => ({
    label: u.nickName || u.userName,
    value: u.userId,
  }))
})

const groupFields = computed(() => defineFields([
  {
    key: 'name',
    label: '组名',
    component: 'NInput',
    search: { enabled: true },
    form: { required: true },
    table: { minWidth: 140 },
  },
  {
    key: 'description',
    label: '描述',
    component: 'NInput',
    form: { span: 2 },
    search: false,
    table: { minWidth: 160, ellipsis: { tooltip: true } },
  },
  {
    key: 'userIds',
    label: '成员',
    component: 'NSelect',
    options: userOptions.value,
    bind: { multiple: true, filterable: true, maxTagCount: 3 },
    form: { required: true, span: 2, defaultValue: [] },
    search: false,
    table: {
      minWidth: 180,
      render: (row: UserGroupVO) => {
        const ids = row.userIds || []
        const labels = ids
          .map(id => userOptions.value.find(o => o.value === id)?.label || String(id))
          .join('、')
        return labels || '-'
      },
    },
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
    key: 'createTime',
    label: '创建时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
]))

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
  fetcher: async query => toBpmPageResult(await getUserGroupPage(buildBpmPageQuery(query))),
  defaults: { name: undefined, status: null },
  formDefaults: () => ({ name: '', description: '', userIds: [], status: 0 }),
})

const tableFields = computed(() => [
  ...groupFields.value,
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
          permission: 'bpm:user-group:update',
          onClick: (r) => openEdit(r as unknown as UserGroupVO),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'bpm:user-group:delete',
          popconfirm: (r) => `是否确认删除用户组「${(r as unknown as UserGroupVO).name}」？`,
          onClick: async (r) => {
            await removeAndRefresh(() => deleteUserGroup((r as unknown as UserGroupVO).id))
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改用户组' : '新增用户组',
  width: 560,
  sections: [{
    type: 'form',
    key: 'main',
    fields: groupFields.value,
    formProps: { cols: 2, labelWidth: 80 },
  }],
}))

function handleAdd() {
  openCreate({ status: 0, userIds: [] })
}

async function handleSubmit() {
  await submitCreateOrUpdate(createUserGroup, updateUserGroup)
}
</script>

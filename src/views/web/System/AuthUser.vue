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
        分配用户
        <template v-if="roleName"> - {{ roleName }}</template>
      </span>
    </div>

    <SearchPanel
      v-model:search-model="searchModel"
      :fields="userFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('system:role:edit')" type="primary" @click="openSelectUsers">
          添加用户
        </n-button>
        <n-button
          v-if="hasPermission('system:role:edit')"
          :disabled="!checkedUserIds.length"
          @click="handleCancelAll"
        >
          批量取消授权
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="system-page__table"
      flex-height
      selectable
      col-setting-key="system-auth-user"
      v-model:checked-row-keys="checkedUserIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: any) => row.userId"
      :loading="loading"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <CommonModal
      v-model:show="selectVisible"
      title="选择用户"
      :width="780"
      :loading="submitting"
      @confirm="handleSelectConfirm"
    >
      <SearchPanel
        v-model:search-model="unallocatedSearch"
        :fields="userFields"
        @search="fetchUnallocated"
      />
      <CommonTable
        selectable
        col-setting-key="system-auth-user-select"
        v-model:checked-row-keys="selectCheckedIds"
        :data="unallocatedData"
        :fields="selectTableFields"
        :page="unallocatedSearch.pageNum as number"
        :page-size="unallocatedSearch.pageSize as number"
        :item-count="unallocatedTotal"
        :row-key="(row: any) => row.userId"
        :loading="unallocatedLoading"
        :table-props="{ maxHeight: 360 }"
        @update:page="onUnallocatedPageChange"
        @update:page-size="onUnallocatedPageSizeChange"
      />
    </CommonModal>
  </div>
</template>

<script setup lang="tsx">
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useRoute, useRouter } from 'vue-router'
import {
  allocatedUserList,
  authUserCancel,
  authUserCancelAll,
  authUserSelectAll,
  getRole,
  unallocatedUserList,
} from '@/api/system/role'
import type { SysUser } from '@/api/system/types'
import { statusOptions } from './constants'
import { usePermission } from '@/hooks/usePermission'

const route = useRoute()
const router = useRouter()
const { message, confirmDanger } = useConfirm()
const { hasPermission } = usePermission()

const roleId = computed(() => Number(route.query.roleId || 0))
const roleName = ref('')
const checkedUserIds = ref<Array<string | number>>([])
const selectVisible = ref(false)
const submitting = ref(false)
const selectCheckedIds = ref<Array<string | number>>([])

const userFields = defineFields([
  {
    key: 'userName',
    label: '用户名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 140 },
  },
  {
    key: 'nickName',
    label: '用户昵称',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 140 },
  },
  {
    key: 'email',
    label: '邮箱',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 180 },
  },
  {
    key: 'phonenumber',
    label: '手机',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 130 },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: statusOptions,
    search: false,
    form: false,
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
    search: false,
    form: false,
    table: { width: 170 },
  },
])

const tableFields = computed(() => [
  ...userFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 120,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'cancel',
          label: '取消授权',
          type: 'error',
          permission: 'system:role:edit',
          onClick: (r) => handleCancel(r as unknown as SysUser),
        },
      ],
    },
  },
])

const selectTableFields = computed(() => [...userFields])

const searchDefaults = {
  roleId: 0,
  ...extractSearchDefaults(userFields),
}

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
  fetcher: async q => toPageResult(await allocatedUserList(q as any)),
  defaults: searchDefaults,
  immediate: false,
})

const {
  searchModel: unallocatedSearch,
  tableData: unallocatedData,
  total: unallocatedTotal,
  loading: unallocatedLoading,
  fetchList: fetchUnallocated,
  handleReset: resetUnallocated,
  onPageChange: onUnallocatedPageChange,
  onPageSizeChange: onUnallocatedPageSizeChange,
} = usePageList({
  fetcher: async q => toPageResult(await unallocatedUserList(q as any)),
  defaults: searchDefaults,
  immediate: false,
})

onMounted(async () => {
  if (!roleId.value) {
    message.error('缺少角色参数')
    goBack()
    return
  }
  searchModel.value.roleId = roleId.value
  unallocatedSearch.value.roleId = roleId.value
  try {
    const { data: role } = await getRole(roleId.value)
    roleName.value = role?.roleName || ''
  }
  catch {
    // ignore
  }
  await fetchList()
})

watch(roleId, (id) => {
  searchModel.value.roleId = id
  unallocatedSearch.value.roleId = id
})

function goBack() {
  router.push({ name: 'System-Role' })
}

function handleCancel(row: SysUser) {
  confirmDanger({
    title: '确认取消授权',
    content: `是否取消用户「${row.userName}」的角色授权？`,
    successMessage: '取消授权成功',
    action: async () => {
      await authUserCancel({ userId: row.userId, roleId: roleId.value })
      await fetchList()
    },
  })
}

function handleCancelAll() {
  if (!checkedUserIds.value.length)
    return
  confirmDanger({
    title: '确认批量取消',
    content: `是否取消选中的 ${checkedUserIds.value.length} 个用户的角色授权？`,
    successMessage: '取消授权成功',
    action: async () => {
      await authUserCancelAll({
        roleId: roleId.value,
        userIds: checkedUserIds.value as number[],
      })
      await fetchList()
    },
  })
}

async function openSelectUsers() {
  selectCheckedIds.value = []
  await resetUnallocated({ roleId: roleId.value })
  selectVisible.value = true
}

async function handleSelectConfirm() {
  if (!selectCheckedIds.value.length) {
    message.warning('请选择要分配的用户')
    return
  }
  submitting.value = true
  try {
    await authUserSelectAll({
      roleId: roleId.value,
      userIds: selectCheckedIds.value as number[],
    })
    message.success('分配成功')
    selectVisible.value = false
    await fetchList()
  }
  finally {
    submitting.value = false
  }
}
</script>

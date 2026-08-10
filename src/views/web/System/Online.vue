<template>
  <div class="system-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="onlineFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button
          v-if="hasPermission('monitor:online:forceLogout')"
          type="error"
          :disabled="!checkedTokenIds.length"
          @click="handleForceLogoutBatch"
        >
          批量强退
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="system-page__table"
      flex-height
      selectable
      col-setting-key="system-online"
      v-model:checked-row-keys="checkedTokenIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: any) => row.tokenId"
      :table-props="{ loading }"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />
  </div>
</template>

<script setup lang="tsx">
import SearchPanel from '@/components/common/SearchPanel.vue'
import CommonTable from '@/components/common/table/CommonTable.vue'
import { defineFields, extractSearchDefaults } from '@/components/common/table/fieldSchema'
import { forceLogout, listOnline } from '@/api/system/online'
import type { SysUserOnline } from '@/api/system/types'
import { usePermission } from '@/hooks/usePermission'

const { confirmDanger } = useConfirm()
const { hasPermission } = usePermission()

const onlineFields = defineFields([
  {
    key: 'tokenId',
    label: '会话编号',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 180, ellipsis: { tooltip: true } },
  },
  {
    key: 'userName',
    label: '登录名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 120 },
  },
  {
    key: 'deptName',
    label: '部门名称',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 120 },
  },
  {
    key: 'ipaddr',
    label: '主机',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 130 },
  },
  {
    key: 'loginLocation',
    label: '登录地点',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 120 },
  },
  {
    key: 'browser',
    label: '浏览器',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 100 },
  },
  {
    key: 'os',
    label: '操作系统',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 120 },
  },
  {
    key: 'loginTime',
    label: '登录时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
])

const checkedTokenIds = ref<Array<string | number>>([])

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
  fetcher: async q => toPageResult(await listOnline(q)),
  defaults: extractSearchDefaults(onlineFields),
})

const tableFields = computed(() => [
  ...onlineFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 100,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'forceLogout',
          label: '强退',
          type: 'error',
          permission: 'monitor:online:forceLogout',
          onClick: (r) => handleForceLogout(r as unknown as SysUserOnline),
        },
      ],
    },
  },
])

function handleForceLogout(row: SysUserOnline) {
  confirmDanger({
    title: '确认强退',
    content: `是否确认强退用户「${row.userName}」？`,
    successMessage: '强退成功',
    action: async () => {
      await forceLogout(row.tokenId)
      await fetchList()
    },
  })
}

function handleForceLogoutBatch() {
  if (!checkedTokenIds.value.length)
    return
  confirmDanger({
    title: '确认强退',
    content: `是否确认强退选中的 ${checkedTokenIds.value.length} 个会话？`,
    successMessage: '强退成功',
    action: async () => {
      for (const tokenId of checkedTokenIds.value)
        await forceLogout(String(tokenId))
      await fetchList()
    },
  })
}
</script>

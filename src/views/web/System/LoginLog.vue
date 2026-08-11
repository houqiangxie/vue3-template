<template>
  <div class="system-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="logFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button
          v-if="hasPermission('monitor:logininfor:remove')"
          :disabled="!checkedIds.length"
          @click="handleDelete"
        >
          删除
        </n-button>
        <n-button v-if="hasPermission('monitor:logininfor:remove')" type="error" @click="handleClean">
          清空
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="system-page__table"
      flex-height
      selectable
      col-setting-key="system-loginlog"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.infoId as number"
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
import { cleanLogininfor, deleteLogininfor, listLogininfor } from '@/api/system/logininfor'
import { loginStatusOptions } from './constants'

const { hasPermission } = usePermission()
const { confirmDanger, confirmBatchDelete } = useConfirm()
const checkedIds = ref<Array<string | number>>([])

const logFields = defineFields([
  {
    key: 'userName',
    label: '用户名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 120 },
  },
  {
    key: 'ipaddr',
    label: '登录地址',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 130 },
  },
  {
    key: 'loginLocation',
    label: '登录地点',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 120 },
  },
  {
    key: 'browser',
    label: '浏览�?,
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 100 },
  },
  {
    key: 'os',
    label: '操作系统',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 120 },
  },
  {
    key: 'status',
    label: '登录状�?,
    component: 'NSelect',
    options: loginStatusOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: {
      width: 100,
      format: 'option',
      tagType: val => (val === '1' ? 'success' : 'error'),
    },
  },
  {
    key: 'msg',
    label: '操作信息',
    component: 'NInput',
    search: false,
    form: false,
    table: { minWidth: 120 },
  },
  {
    key: 'loginTime',
    label: '登录时间',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 170 },
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
} = usePageList({
  fetcher: async query => toPageResult(await listLogininfor(query)),
  defaults: extractSearchDefaults(logFields),
})

const tableFields = computed(() => [...logFields])

function handleDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '日志',
    action: () => deleteLogininfor(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

function handleClean() {
  confirmDanger({
    title: '确认清空',
    content: '是否确认清空所有登录日志？',
    successMessage: '清空成功',
    action: async () => {
      await cleanLogininfor()
      await fetchList()
    },
  })
}
</script>

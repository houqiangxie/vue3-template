<template>
  <div class="system-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="logFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button
          v-if="hasPermission('monitor:operlog:remove')"
          :disabled="!checkedIds.length"
          @click="handleDelete"
        >
          删除
        </n-button>
        <n-button v-if="hasPermission('monitor:operlog:remove')" type="error" @click="handleClean">
          清空
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="system-page__table"
      flex-height
      selectable
      col-setting-key="system-operlog"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.operId as number"
      :table-props="{ loading }"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <CommonModal
      v-model:show="detailVisible"
      title="操作日志详情"
      :width="720"
      :show-footer="false"
    >
      <n-descriptions bordered :column="2" label-placement="left" size="small">
        <n-descriptions-item label="操作模块">{{ detail?.title }}</n-descriptions-item>
        <n-descriptions-item label="业务类型">{{ businessLabel(detail?.businessType) }}</n-descriptions-item>
        <n-descriptions-item label="请求方式">{{ detail?.requestMethod }}</n-descriptions-item>
        <n-descriptions-item label="操作人员">{{ detail?.operName }}</n-descriptions-item>
        <n-descriptions-item label="操作地址">{{ detail?.operIp }}</n-descriptions-item>
        <n-descriptions-item label="操作地点">{{ detail?.operLocation }}</n-descriptions-item>
        <n-descriptions-item label="操作状态">{{ detail?.status === '0' ? '成功' : '失败' }}</n-descriptions-item>
        <n-descriptions-item label="消耗时间">{{ detail?.costTime }} ms</n-descriptions-item>
        <n-descriptions-item label="操作时间" :span="2">{{ detail?.operTime }}</n-descriptions-item>
        <n-descriptions-item label="请求地址" :span="2">{{ detail?.operUrl }}</n-descriptions-item>
        <n-descriptions-item label="操作方法" :span="2">{{ detail?.method }}</n-descriptions-item>
        <n-descriptions-item label="请求参数" :span="2">{{ detail?.operParam }}</n-descriptions-item>
        <n-descriptions-item label="返回参数" :span="2">{{ detail?.jsonResult }}</n-descriptions-item>
        <n-descriptions-item v-if="detail?.errorMsg" label="异常信息" :span="2">{{ detail?.errorMsg }}</n-descriptions-item>
      </n-descriptions>
    </CommonModal>
  </div>
</template>

<script setup lang="tsx">
import SearchPanel from '@/components/common/SearchPanel.vue'
import CommonTable from '@/components/common/table/CommonTable.vue'
import CommonModal from '@/components/common/modal/CommonModal.vue'
import { defineFields, extractSearchDefaults } from '@/components/common/table/fieldSchema'
import { cleanOperLog, deleteOperLog, listOperLog } from '@/api/system/operlog'
import type { SysOperLog } from '@/api/system/types'
import { businessTypeOptions, operStatusOptions } from './constants'
import { usePermission } from '@/hooks/usePermission'

const { hasPermission } = usePermission()
const { confirmDanger, confirmBatchDelete } = useConfirm()
const checkedIds = ref<Array<string | number>>([])

const logFields = defineFields([
  {
    key: 'title',
    label: '系统模块',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 120 },
  },
  {
    key: 'businessType',
    label: '操作类型',
    component: 'NSelect',
    options: businessTypeOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: {
      width: 100,
      format: 'option',
    },
  },
  {
    key: 'operName',
    label: '操作人员',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 100 },
  },
  {
    key: 'operIp',
    label: '操作地址',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 120 },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: operStatusOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: {
      width: 80,
      format: 'option',
      tagType: val => (val === '0' ? 'success' : 'error'),
    },
  },
  {
    key: 'operTime',
    label: '操作时间',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 170 },
  },
  {
    key: 'costTime',
    label: '耗时(ms)',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 90, align: 'center' },
  },
])

const detailVisible = ref(false)
const detail = ref<SysOperLog | null>(null)

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
  fetcher: async query => toPageResult(await listOperLog(query)),
  defaults: extractSearchDefaults(logFields),
})

const tableFields = computed(() => [
  ...logFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 80,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'detail',
          label: '详细',
          type: 'primary',
          onClick: (r) => openDetail(r as unknown as SysOperLog),
        },
      ],
    },
  },
])

function businessLabel(type?: number) {
  return businessTypeOptions.find(o => o.value === type)?.label || '-'
}

function openDetail(row: SysOperLog) {
  detail.value = row
  detailVisible.value = true
}

function handleDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '日志',
    action: () => deleteOperLog(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

function handleClean() {
  confirmDanger({
    title: '确认清空',
    content: '是否确认清空所有操作日志？',
    successMessage: '清空成功',
    action: async () => {
      await cleanOperLog()
      await fetchList()
    },
  })
}
</script>

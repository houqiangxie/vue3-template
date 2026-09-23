<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    />

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      col-setting-key="bpm-task-copy"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => String(row.id)"
      :loading="loading"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />
  </div>
</template>

<script setup lang="tsx">
import { useRouter } from 'vue-router'
import { NButton, NSpace, NText } from 'naive-ui'
import { getProcessInstanceCopyPage } from '@/api/bpm/processInstance'
import { buildBpmPageQuery, toBpmPageResult } from '@/views/web/Bpm/constants'
import { defineFields, extractSearchDefaults } from '@/utils/schema'
import { usePageList } from '@/hooks/usePageList'
import { pushBpmProcessDetail } from '@/views/web/Bpm/routeNames'

defineOptions({ name: 'Bpm-TaskCopy' })

const router = useRouter()
const message = useMessage()

const searchFields = defineFields([
  {
    key: 'processInstanceName',
    label: '流程名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
])

const tableFields = defineFields([
  {
    key: 'processInstanceName',
    label: '流程名',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 160 },
  },
  {
    key: 'summary',
    label: '摘要',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      minWidth: 180,
      render: (row: any) => {
        const summary = row.summary
        if (!Array.isArray(summary) || !summary.length)
          return '-'
        return (
          <div style="display:flex;flex-direction:column;gap:2px;">
            {summary.map((item: any, index: number) => (
              <NText key={index} depth={3} style="font-size:12px;">
                {item.key}
                :
                {item.value}
              </NText>
            ))}
          </div>
        )
      },
    },
  },
  {
    key: 'startUserNickname',
    label: '流程发起人',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 120,
      render: (row: any) => row.startUser?.nickname || row.startUserNickname || row.startUser?.name || '-',
    },
  },
  {
    key: 'processInstanceStartTime',
    label: '流程发起时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
  {
    key: 'activityName',
    label: '抄送节点',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 120 },
  },
  {
    key: 'createUserNickname',
    label: '抄送人',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 110,
      render: (row: any) => row.createUser?.nickname || row.createUser?.name || row.createUserNickname || '系统',
    },
  },
  {
    key: 'reason',
    label: '抄送意见',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 140, ellipsis: { tooltip: true } },
  },
  {
    key: 'createTime',
    label: '抄送时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
  {
    key: 'actions',
    label: '操作',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 90,
      fixed: 'right',
      render: (row: any) => (
        <NSpace size={8}>
          <NButton text type="primary" onClick={() => goDetail(row)}>
            详情
          </NButton>
        </NSpace>
      ),
    },
  },
])

const {
  searchModel,
  tableData,
  total,
  loading,
  handleSearch,
  onPageChange,
  onPageSizeChange,
} = usePageList({
  fetcher: async (query) => {
    const data = await getProcessInstanceCopyPage(buildBpmPageQuery(query))
    return toBpmPageResult(data as any)
  },
  defaults: extractSearchDefaults(searchFields),
})

function goDetail(row: any) {
  if (!row.processInstanceId) {
    message.warning('缺少流程实例编号')
    return
  }
  pushBpmProcessDetail(router, {
    id: String(row.processInstanceId),
    activityId: row.activityId ? String(row.activityId) : undefined,
  })
}
</script>

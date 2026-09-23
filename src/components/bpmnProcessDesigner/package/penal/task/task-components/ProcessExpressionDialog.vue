<template>
  <CommonModal
    v-model:show="dialogVisible"
    :config="modalConfig"
    :show-footer="false"
  >
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    />
    <CommonTable
      class="mt-12px"
      :data="tableData"
      :fields="tableFields"
      :loading="loading"
      :flex-height="false"
      :csv-export="false"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      remote
      :table-props="{ striped: true, size: 'small' }"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />
  </CommonModal>
</template>

<script setup lang="ts">
import { CommonStatusEnum } from '@/utils/constants'
import { ProcessExpressionApi, type ProcessExpressionVO } from '@/api/bpm/processExpression'
import { usePageList } from '@/hooks/usePageList'
import { defineFields, defineModal, extractSearchDefaults } from '@/utils/schema'

defineOptions({ name: 'ProcessExpressionDialog' })

const dialogVisible = ref(false)
const listenerType = ref('')
const emit = defineEmits<{ select: [row: ProcessExpressionVO] }>()

const modalConfig = defineModal({
  title: '请选择表达式',
  width: 1024,
  showFooter: false,
})

const searchFields = defineFields([
  {
    key: 'name',
    label: '名字',
    component: 'NInput',
    search: { enabled: true },
    form: false,
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
} = usePageList({
  defaults: extractSearchDefaults(searchFields),
  immediate: false,
  fetcher: async (query) => {
    const data = await ProcessExpressionApi.getProcessExpressionPage({
      pageNo: query.pageNum,
      pageSize: query.pageSize,
      name: query.name || undefined,
      ...(listenerType.value ? { type: listenerType.value } : {}),
      status: CommonStatusEnum.ENABLE,
    })
    return {
      rows: (data.list ?? []) as unknown as Record<string, unknown>[],
      total: data.total ?? 0,
    }
  },
})

const tableFields = computed(() => defineFields([
  {
    key: 'name',
    label: '名字',
    form: false,
    search: false,
    table: { align: 'center' },
  },
  {
    key: 'expression',
    label: '表达式',
    form: false,
    search: false,
    table: { align: 'center' },
  },
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      align: 'center',
      actions: (row: ProcessExpressionVO) => [
        {
          key: 'select',
          label: '选择',
          type: 'primary',
          onClick: () => select(row),
        },
      ],
    },
  },
]))

function open(type?: string) {
  listenerType.value = type || ''
  searchModel.value.pageNum = 1
  searchModel.value.name = ''
  fetchList()
  dialogVisible.value = true
}
defineExpose({ open })

function select(row: ProcessExpressionVO) {
  dialogVisible.value = false
  emit('select', row)
}
</script>

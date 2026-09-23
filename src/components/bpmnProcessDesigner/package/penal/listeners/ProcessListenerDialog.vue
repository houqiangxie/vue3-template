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
import { h } from 'vue'
import { ProcessListenerApi, type ProcessListenerVO } from '@/api/bpm/processListener'
import DictTag from '@/components/bpm/DictTag.vue'
import { DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { usePageList } from '@/hooks/usePageList'
import { defineFields, defineModal, extractSearchDefaults } from '@/utils/schema'

defineOptions({ name: 'ProcessListenerDialog' })

const dialogVisible = ref(false)
const listenerType = ref('')
const emit = defineEmits<{ select: [row: ProcessListenerVO] }>()

const modalConfig = defineModal({
  title: '请选择监听器',
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
  {
    key: 'event',
    label: '事件',
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
    const data = await ProcessListenerApi.getProcessListenerPage({
      pageNo: query.pageNum,
      pageSize: query.pageSize,
      name: query.name || undefined,
      event: query.event || undefined,
      type: listenerType.value,
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
    key: 'type',
    label: '类型',
    form: false,
    search: false,
    table: {
      align: 'center',
      render: (row: ProcessListenerVO) =>
        h(DictTag, { type: DICT_TYPE.BPM_PROCESS_LISTENER_TYPE, value: row.type }),
    },
  },
  {
    key: 'event',
    label: '事件',
    form: false,
    search: false,
    table: { align: 'center' },
  },
  {
    key: 'valueType',
    label: '值类型',
    form: false,
    search: false,
    table: {
      align: 'center',
      render: (row: ProcessListenerVO) =>
        h(DictTag, { type: DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE, value: row.valueType }),
    },
  },
  {
    key: 'value',
    label: '值',
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
      actions: (row: ProcessListenerVO) => [
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

function open(type: string) {
  listenerType.value = type
  searchModel.value.pageNum = 1
  searchModel.value.name = ''
  searchModel.value.event = ''
  fetchList()
  dialogVisible.value = true
}
defineExpose({ open })

function select(row: ProcessListenerVO) {
  dialogVisible.value = false
  emit('select', row)
}
</script>

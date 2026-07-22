<!--
 * 表格组件：支持 columns 或统一 fields 配置
-->
<template>
  <div class="rounded bg-white p-3">
    <n-data-table
      :columns="resolvedColumns"
      :data="data"
      :pagination="showPagination ? pagination : false"
      :row-key="rowKey"
      v-bind="tableProps"
    />
  </div>
</template>

<script setup lang="ts">
import type { DataTableColumns, DataTableProps } from 'naive-ui'
import { toTableColumns, type UnifiedFieldConfig } from './fieldSchema'

const props = withDefaults(defineProps<{
  data: Record<string, unknown>[]
  /** Naive UI 原生 columns（与 fields 二选一，fields 优先） */
  columns?: DataTableColumns
  /** 统一字段配置，自动生成 columns */
  fields?: UnifiedFieldConfig[]
  rowKey?: DataTableProps['rowKey']
  tableProps?: Omit<DataTableProps, 'columns' | 'data' | 'pagination' | 'rowKey'>
  page?: number
  pageSize?: number
  pageSizes?: number[]
  showPagination?: boolean
}>(), {
  columns: () => [],
  fields: () => [],
  page: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 30, 40, 50],
  showPagination: true,
  tableProps: () => ({}),
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()

const resolvedColumns = computed<DataTableColumns>(() => {
  if (props.fields.length)
    return toTableColumns(props.fields)
  return props.columns
})

const pagination = reactive({
  page: props.page,
  pageSize: props.pageSize,
  showSizePicker: true,
  pageSizes: props.pageSizes,
  onChange: (page: number) => {
    pagination.page = page
    emit('update:page', page)
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    emit('update:pageSize', pageSize)
  },
})

watch(() => props.page, (val) => { pagination.page = val })
watch(() => props.pageSize, (val) => { pagination.pageSize = val })
</script>

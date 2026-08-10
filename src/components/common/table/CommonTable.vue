<!--
 * 表格组件：支持 columns 或统一 fields 配置
 * flexHeight：跟随父级 flex 高度（父级需 flex-1 / h-full 且有确定高度）
 * colSettingKey：开启列设置（拖拽排序 + 显隐，持久化到 localStorage）
 -->
<template>
  <div
    class="common-table rounded p-3"
    :class="{
      'common-table--flex': flexHeight,
      'common-table--has-toolbar': enableColSetting,
    }"
    :style="{ backgroundColor: themeVars.cardColor }"
  >
    <div class="common-table__body" :class="{ 'common-table__body--flex': flexHeight }">
      <n-data-table
        :class="{ 'h-full': flexHeight }"
        :flex-height="flexHeight"
        :columns="resolvedColumns"
        :data="data"
        :pagination="showPagination ? pagination : false"
        :row-key="rowKey"
        v-bind="mergedTableProps"
      />
    </div>

    <div v-if="enableColSetting" class="common-table__toolbar">
      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <n-button quaternary circle size="small" @click="openColSetting">
            <template #icon>
              <n-icon size="16">
                <OptionsOutline />
              </n-icon>
            </template>
          </n-button>
        </template>
        列设置
      </n-tooltip>
    </div>

    <ColSetting
      v-if="enableColSetting"
      ref="colSettingRef"
      :storage-key="colSettingKey!"
      @change="onColSettingChange"
      @reset="onColSettingReset"
    />
  </div>
</template>

<script setup lang="ts">
import type { DataTableColumns, DataTableProps } from 'naive-ui'
import { useThemeVars } from 'naive-ui'
import { OptionsOutline } from '@vicons/ionicons5'
import { toTableColumns, type UnifiedFieldConfig } from './fieldSchema'
import ColSetting from './ColSetting.vue'
import {
  applyColSetting,
  buildColSettingItems,
} from './colSetting'
import type { ColSettingItem } from './types'

const themeVars = useThemeVars()

const props = withDefaults(defineProps<{
  data: Record<string, unknown>[]
  /** Naive UI 原生 columns（与 fields 二选一，fields 优先） */
  columns?: DataTableColumns
  /** 统一字段配置，自动生成 columns */
  fields?: UnifiedFieldConfig[]
  rowKey?: DataTableProps['rowKey']
  tableProps?: Omit<DataTableProps, 'columns' | 'data' | 'pagination' | 'rowKey' | 'flexHeight'>
  page?: number
  pageSize?: number
  /** 服务端分页总条数 */
  itemCount?: number
  pageSizes?: number[]
  showPagination?: boolean
  /**
   * 表格高度跟随父容器（需父级有确定高度，如 flex-1 + min-h-0）
   * 弹窗内表格请保持默认 false
   */
  flexHeight?: boolean
  /** 开启多选列 */
  selectable?: boolean
  /**
   * 列设置持久化 key（参考 guanweb ProTable colSettingName）
   * 传入后开启列拖拽排序与显隐配置
   */
  colSettingKey?: string
  /**
   * 数据变更时自动清空勾选（分页/搜索刷新后常见需求），默认 true
   */
  clearCheckedOnDataChange?: boolean
  /**
   * 勾选变更时过滤 keys（如排除超级管理员 id=1）
   */
  filterCheckedKeys?: (keys: Array<string | number>) => Array<string | number>
}>(), {
  columns: () => [],
  fields: () => [],
  page: 1,
  pageSize: 10,
  itemCount: undefined,
  pageSizes: () => [10, 20, 30, 40, 50],
  showPagination: true,
  tableProps: () => ({}),
  flexHeight: true,
  selectable: false,
  colSettingKey: undefined,
  clearCheckedOnDataChange: true,
  filterCheckedKeys: undefined,
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()

/** 多选行 key；selectable 时由表格托管，页面用 v-model:checked-row-keys */
const checkedRowKeys = defineModel<Array<string | number>>('checkedRowKeys', {
  default: () => [],
})

const enableColSetting = computed(() => Boolean(props.colSettingKey && props.fields.length))

const colSettingRef = ref<InstanceType<typeof ColSetting>>()
const colSettingItems = ref<ColSettingItem[]>([])

function syncColSettingFromFields() {
  if (!props.colSettingKey)
    return
  colSettingItems.value = buildColSettingItems(props.fields, props.colSettingKey)
}

watch(
  () => [props.fields, props.colSettingKey] as const,
  () => syncColSettingFromFields(),
  { immediate: true, deep: true },
)

const displayFields = computed(() => {
  if (!enableColSetting.value || !colSettingItems.value.length)
    return props.fields
  return applyColSetting(props.fields, colSettingItems.value)
})

function withDefaultResizable(cols: DataTableColumns): DataTableColumns {
  return cols.map((col) => {
    if ('type' in col && (col.type === 'selection' || col.type === 'expand'))
      return col
    if ('children' in col && col.children)
      return { ...col, children: withDefaultResizable(col.children as DataTableColumns) as typeof col.children }
    return {
      ...col,
      resizable: (col as { resizable?: boolean }).resizable !== false,
    }
  }) as DataTableColumns
}

const resolvedColumns = computed<DataTableColumns>(() => {
  const cols = withDefaultResizable(
    props.fields.length
      ? toTableColumns(displayFields.value)
      : (props.columns ?? []),
  )
  if (props.selectable)
    return [{ type: 'selection' }, ...cols]
  return cols
})

function openColSetting() {
  if (!props.colSettingKey)
    return
  syncColSettingFromFields()
  colSettingRef.value?.open(colSettingItems.value)
}

function onColSettingChange(items: ColSettingItem[]) {
  colSettingItems.value = items
}

function onColSettingReset() {
  syncColSettingFromFields()
  colSettingRef.value?.open(colSettingItems.value)
}

const pagination = reactive({
  page: props.page,
  pageSize: props.pageSize,
  itemCount: props.itemCount,
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
watch(() => props.itemCount, (val) => { pagination.itemCount = val })

/** selectable 时注入勾选，避免业务页再塞 table-props */
const mergedTableProps = computed(() => {
  const base = { ...(props.tableProps || {}) } as Record<string, unknown>
  if (!props.selectable)
    return base

  return {
    ...base,
    checkedRowKeys: checkedRowKeys.value,
    onUpdateCheckedRowKeys: (keys: Array<string | number>) => {
      checkedRowKeys.value = props.filterCheckedKeys
        ? props.filterCheckedKeys(keys)
        : keys
    },
  }
})

watch(
  () => props.data,
  () => {
    if (!props.selectable || !props.clearCheckedOnDataChange)
      return
    if (checkedRowKeys.value.length)
      checkedRowKeys.value = []
  },
)

function clearChecked() {
  checkedRowKeys.value = []
}

defineExpose({ openColSetting, clearChecked })
</script>

<style scoped>
.common-table {
  position: relative;
}

/* 列设置按钮：贴在表头右侧并与表头垂直居中，不占上方空间 */
.common-table__toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  /* 与 n-data-table 默认表头高度对齐（th padding 12*2 + 行高 ≈ 46） */
  height: 46px;
  padding: 0 4px;
  pointer-events: none;
}

.common-table__toolbar :deep(.n-button) {
  pointer-events: auto;
  background-color: v-bind('themeVars.cardColor');
}

/* 给表头右侧留出按钮空间，避免遮住最后一列标题 */
.common-table--has-toolbar :deep(.n-data-table-thead .n-data-table-th:last-child) {
  padding-right: 40px;
}

/* 操作列等内容在单元格内上下居中 */
.common-table :deep(.n-data-table-th),
.common-table :deep(.n-data-table-td) {
  vertical-align: middle;
}

.common-table__body--flex {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.common-table--flex {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.common-table--flex :deep(.n-data-table) {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.common-table--flex :deep(.n-data-table-wrapper),
.common-table--flex :deep(.n-data-table-base-table) {
  flex: 1 1 0%;
  min-height: 0;
}
</style>

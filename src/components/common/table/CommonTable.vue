<!--
 * 表格组件：支持 columns 或统一 fields 配置
 * flexHeight：跟随父级 flex 高度（父级需 flex-1 / h-full 且有确定高度）
 * colSettingKey：开启列设置（拖拽排序 + 显隐，持久化到 localStorage）
 * csvExport：默认开启 CSV 导出（与列设置合并为一个工具按钮）
 * loading / emptyText：统一加载与空状态；首次加载展示骨架
 * virtualScroll：虚拟滚动，默认关闭
 -->
<template>
  <div
    class="common-table rounded p-3"
    :class="{
      'common-table--flex': flexHeight,
      'common-table--has-toolbar': showToolbar,
    }"
    :style="{ backgroundColor: themeVars.cardColor }"
  >
    <div class="common-table__body" :class="{ 'common-table__body--flex': flexHeight }">
      <div
        v-if="showSkeleton"
        class="common-table__skeleton"
        :class="{ 'common-table__skeleton--flex': flexHeight }"
      >
        <div class="common-table__skeleton-head">
          <n-skeleton
            v-for="n in skeletonColCount"
            :key="`h-${n}`"
            height="18px"
            round
          />
        </div>
        <div
          v-for="row in skeletonRows"
          :key="`r-${row}`"
          class="common-table__skeleton-row"
        >
          <n-skeleton
            v-for="n in skeletonColCount"
            :key="`c-${row}-${n}`"
            height="14px"
            round
          />
        </div>
      </div>
      <n-data-table
        v-else
        ref="tableRef"
        :class="{ 'h-full': flexHeight }"
        :flex-height="flexHeight"
        :virtual-scroll="virtualScroll"
        :columns="resolvedColumns"
        :data="data"
        :pagination="showPagination ? pagination : false"
        :row-key="rowKey"
        v-bind="mergedTableProps"
        :loading="overlayLoading"
        :get-csv-cell="getCsvCell"
      >
        <template #empty>
          <slot name="empty">
            <n-empty :description="emptyText" size="small" />
          </slot>
        </template>
      </n-data-table>
    </div>

    <div v-if="showToolbar" class="common-table__toolbar">
      <n-dropdown
        v-if="isToolbarDropdown"
        trigger="hover"
        placement="bottom-end"
        :options="toolbarDropdownOptions"
        @select="onToolbarSelect"
      >
        <n-button quaternary circle size="small">
          <template #icon>
            <n-icon size="16">
              <component :is="toolbarIcon" />
            </n-icon>
          </template>
        </n-button>
      </n-dropdown>
      <n-button
        v-else
        quaternary
        circle
        size="small"
        @click="onToolbarSingleClick"
      >
        <template #icon>
          <n-icon size="16">
            <component :is="toolbarIcon" />
          </n-icon>
        </template>
      </n-button>
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
import type { DataTableColumns, DataTableInst, DataTableProps, DropdownOption } from 'naive-ui'
import { useThemeVars } from 'naive-ui'
import { DownloadOutline, OptionsOutline } from '@vicons/ionicons5'
import { toTableColumns, type UnifiedFieldConfig, escapeCsvCell, formatExportCellValue, isFieldInScene, resolveColumnKey, withExportColumnFlags } from './fieldSchema'
import ColSetting from './ColSetting.vue'
import {
  applyColSetting,
  buildColSettingItems,
} from './colSetting'
import { hasPermission, resolveActionKey } from './table-action.utils'
import type {
  ColSettingItem,
  TableActionItem,
  TableCsvExportConfig,
  TableCsvExportOptions,
} from './types'

const themeVars = useThemeVars()

const props = withDefaults(defineProps<{
  data: Record<string, unknown>[]
  /** Naive UI 原生 columns（与 fields 二选一，fields 优先） */
  columns?: DataTableColumns
  /** 统一字段配置，自动生成 columns */
  fields?: UnifiedFieldConfig[]
  rowKey?: DataTableProps['rowKey']
  tableProps?: Omit<DataTableProps, 'columns' | 'data' | 'pagination' | 'rowKey' | 'flexHeight' | 'loading' | 'virtualScroll'>
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
  /** 虚拟滚动（大数据量时按需开启，需配合确定高度 / flexHeight） */
  virtualScroll?: boolean
  /** 开启多选列 */
  selectable?: boolean
  /**
   * 列设置持久化 key
   * 传入后开启列拖拽排序与显隐配置
   */
  colSettingKey?: string
  /**
   * CSV 导出（默认开启，与列设置合并为一个工具按钮）
   * - true：默认「原始数据 / 展示数据」
   * - false：关闭
   * - 对象：自定义 fileName / permission / actions
   */
  csvExport?: boolean | TableCsvExportConfig
  /** 加载态（替代 table-props.loading） */
  loading?: boolean
  /** 空状态文案 */
  emptyText?: string
  /** 首次加载（loading 且无数据）骨架行数 */
  skeletonRows?: number
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
  virtualScroll: false,
  selectable: false,
  colSettingKey: undefined,
  csvExport: true,
  loading: false,
  emptyText: '暂无数据',
  skeletonRows: 8,
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

const tableRef = ref<DataTableInst | null>(null)
const enableColSetting = computed(() => Boolean(props.colSettingKey && props.fields.length))
const enableCsvExport = computed(() => props.csvExport !== false)
const showToolbar = computed(() => cleanedToolbarActions.value.length > 0)

/** 首次加载：loading 且无数据 → 骨架；已有数据再刷新 → 表格 loading 遮罩 */
const showSkeleton = computed(() => props.loading && props.data.length === 0)
const overlayLoading = computed(() => props.loading && props.data.length > 0)

const csvExportConfig = computed<TableCsvExportConfig>(() => {
  if (props.csvExport && typeof props.csvExport === 'object')
    return props.csvExport
  return {}
})
const csvExportFileName = computed(() => csvExportConfig.value.fileName ?? 'export')

/** 导出 + 列设置合并为同一组操作，多项时一个下拉 */
const toolbarActions = computed<TableActionItem[]>(() => {
  const actions: TableActionItem[] = []
  const exportPerm = csvExportConfig.value.permission

  if (enableCsvExport.value) {
    const custom = csvExportConfig.value.actions
    if (custom?.length) {
      actions.push(...custom.map(item => ({
        ...item,
        permission: item.permission ?? exportPerm,
      })))
    }
    else {
      const name = csvExportFileName.value
      actions.push(
        {
          key: 'original',
          label: '导出原始数据',
          permission: exportPerm,
          onClick: () => exportOriginalData(name),
        },
        {
          key: 'display',
          label: '导出展示数据',
          permission: exportPerm,
          onClick: () => exportDisplayData(name),
        },
      )
    }
  }

  if (enableColSetting.value) {
    if (actions.length)
      actions.push({ key: 'toolbar-divider', label: '', divider: true })
    actions.push({
      key: 'col-setting',
      label: '列设置',
      onClick: () => openColSetting(),
    })
  }

  return actions
})

const cleanedToolbarActions = computed(() => {
  const filtered = toolbarActions.value.filter((action) => {
    if (action.divider)
      return true
    return hasPermission(action.permission)
  })
  const result: TableActionItem[] = []
  for (const action of filtered) {
    if (action.divider) {
      if (!result.length || result[result.length - 1]?.divider)
        continue
      result.push(action)
      continue
    }
    result.push(action)
  }
  while (result.length && result[result.length - 1]?.divider)
    result.pop()
  return result
})

const isToolbarDropdown = computed(() => cleanedToolbarActions.value.length > 1)

const toolbarIcon = computed(() => {
  const keys = cleanedToolbarActions.value.map(a => a.key)
  if (keys.includes('col-setting'))
    return OptionsOutline
  return DownloadOutline
})

const toolbarActionMap = computed(() => {
  const map = new Map<string, TableActionItem>()
  cleanedToolbarActions.value.forEach((action, index) => {
    if (action.divider)
      return
    map.set(resolveActionKey(action, index), action)
  })
  return map
})

const toolbarDropdownOptions = computed<DropdownOption[]>(() =>
  cleanedToolbarActions.value.map((action, index) => {
    const key = resolveActionKey(action, index)
    if (action.divider)
      return { key, type: 'divider' as const }
    return {
      key,
      label: typeof action.label === 'function' ? String(action.label({} as never)) : action.label,
    }
  }),
)

async function runToolbarAction(action: TableActionItem) {
  if (action.divider || !action.onClick)
    return
  await action.onClick({} as never)
}

async function onToolbarSelect(key: string | number) {
  const action = toolbarActionMap.value.get(String(key))
  if (action)
    await runToolbarAction(action)
}

async function onToolbarSingleClick() {
  const action = cleanedToolbarActions.value[0]
  if (action)
    await runToolbarAction(action)
}

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
  const withSelection = props.selectable
    ? [{ type: 'selection' as const }, ...cols]
    : cols
  return withExportColumnFlags(withSelection)
})

const skeletonColCount = computed(() => {
  const cols = resolvedColumns.value.filter((col) => {
    if ('type' in col && (col.type === 'selection' || col.type === 'expand'))
      return false
    return true
  })
  return Math.min(Math.max(cols.length, 3), 6)
})
const skeletonGridColumns = computed(() => `repeat(${skeletonColCount.value}, minmax(0, 1fr))`)

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

/** selectable 时注入勾选；loading 由独立 prop 控制 */
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

/** original：原始值；display：格式化后的展示文案 */
const csvExportMode = ref<'original' | 'display'>('original')

const exportFieldMap = computed(() => {
  const map = new Map<string, { field: UnifiedFieldConfig, table: NonNullable<Exclude<UnifiedFieldConfig['table'], false>> }>()
  const fields = displayFields.value.length ? displayFields.value : props.fields
  for (const field of fields) {
    if (!isFieldInScene(field, 'table'))
      continue
    const table = field.table === false ? {} : (field.table ?? {})
    map.set(resolveColumnKey(field), { field, table })
  }
  return map
})

function getCsvCell(
  value: unknown,
  row: Record<string, unknown>,
  col: { key?: string | number },
) {
  if (csvExportMode.value === 'original') {
    if (value == null)
      return ''
    return escapeCsvCell(typeof value === 'string' ? value : `${value}`)
  }

  const key = String(col.key ?? '')
  const meta = exportFieldMap.value.get(key)
  if (!meta)
    return escapeCsvCell(value == null ? '' : String(value))

  return escapeCsvCell(formatExportCellValue(value, meta.field, meta.table, row))
}

/** 底层 CSV 导出（Naive UI downloadCsv） */
function downloadCsv(options?: TableCsvExportOptions) {
  tableRef.value?.downloadCsv(options)
}

/** 导出原始 data（不受当前页筛选/排序影响，单元格为原始值） */
function exportOriginalData(fileName = 'export') {
  csvExportMode.value = 'original'
  downloadCsv({ fileName, keepOriginalData: true })
}

/** 导出当前展示数据（筛选/排序后；单元格为格式化文案） */
function exportDisplayData(fileName = 'export') {
  csvExportMode.value = 'display'
  downloadCsv({ fileName, keepOriginalData: false })
}

defineExpose({
  openColSetting,
  clearChecked,
  downloadCsv,
  exportOriginalData,
  exportDisplayData,
})
</script>

<style scoped>
.common-table {
  position: relative;
}

/* 工具按钮：贴在表头右侧并与表头垂直居中，不占上方空间 */
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

.common-table__skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 4px 16px;
  box-sizing: border-box;
}

.common-table__skeleton--flex {
  flex: 1 1 0%;
  min-height: 0;
}

.common-table__skeleton-head,
.common-table__skeleton-row {
  display: grid;
  grid-template-columns: v-bind(skeletonGridColumns);
  gap: 16px;
  align-items: center;
}

.common-table__skeleton-head {
  padding-bottom: 8px;
  border-bottom: 1px solid v-bind('themeVars.dividerColor');
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

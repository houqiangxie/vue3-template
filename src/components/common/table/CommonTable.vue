<!--
 * 表格组件：支持 columns 或统一 fields 配置
 * flexHeight：跟随父级 flex 高度（父级需 flex-1 / h-full 且有确定高度）
 * showIndex：序号列（分页时连续编号）
 * remote：远程分页/排序/筛选（sortable / filter 列不再本地处理）
 * expand：展开行（prop / #expand 插槽）；tree：树表 childrenKey / defaultExpandAll
 * summary：合计行；clearCheckedOnDataChange：数据变更时是否清空勾选
 * colSettingKey：开启列设置（拖拽排序 + 显隐，持久化到 local）
 * csvExport / toolbarActions / #toolbar / #toolbar-extra：工具栏
 * loading / emptyText：统一加载与空状态；首次加载展示骨架
 * virtualScroll：虚拟滚动；未显式开启时，flexHeight 且行数 ≥ 40 自动开启
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
        :virtual-scroll="effectiveVirtualScroll"
        :remote="remote"
        :columns="resolvedColumns"
        :data="data"
        :pagination="showPagination ? pagination : false"
        :row-key="rowKey"
        :summary="resolvedSummary"
        v-bind="mergedTableProps"
        :loading="overlayLoading"
        :get-csv-cell="getCsvCell"
        @update:sorter="onUpdateSorter"
        @update:filters="onUpdateFilters"
      >
        <template #empty>
          <slot name="empty">
            <n-empty :description="emptyText" size="small" />
          </slot>
        </template>
      </n-data-table>
    </div>

    <div v-if="showToolbar" class="common-table__toolbar">
      <slot name="toolbar">
        <div class="common-table__toolbar-inner">
          <slot name="toolbar-extra" />
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
            v-else-if="cleanedToolbarActions.length === 1"
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
      </slot>
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
import type { DataTableColumns, DataTableInst, DataTableProps, DataTableSortState, DropdownOption } from 'naive-ui'
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
  TableExpandConfig,
  TableFilterState,
  TableSortState,
  TableSummaryCell,
  TableSummaryConfig,
  TableTreeConfig,
} from './types'

const themeVars = useThemeVars()
const slots = useSlots()

const props = withDefaults(defineProps<{
  data: Record<string, unknown>[]
  /** Naive UI 原生 columns（与 fields 二选一，fields 优先） */
  columns?: DataTableColumns
  /** 统一字段配置，自动生成 columns */
  fields?: UnifiedFieldConfig[]
  rowKey?: DataTableProps['rowKey']
  tableProps?: Omit<DataTableProps, 'columns' | 'data' | 'pagination' | 'rowKey' | 'flexHeight' | 'loading' | 'virtualScroll' | 'remote' | 'summary'>
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
  /** 虚拟滚动；未传时：flexHeight 且当前页 ≥ 40 行自动开启 */
  virtualScroll?: boolean
  /**
   * 远程模式：分页 / 排序 / 筛选由外部处理
   * （配合 @update:sorter / @update:filters + usePageList）
   */
  remote?: boolean
  /** 显示序号列（分页时按全局连续编号） */
  showIndex?: boolean
  /** 序号列标题，默认「#」 */
  indexTitle?: string
  /** 序号列宽度 */
  indexWidth?: number
  /** 开启选择列（默认多选 checkbox） */
  selectable?: boolean
  /**
   * 选择列是否多选；false 时为单选（radio），对应 Naive UI selection.multiple
   * 仅在 selectable 开启时生效，默认 true
   */
  selectionMultiple?: boolean
  /** 按行禁用勾选（仅 selectable 时生效） */
  selectionDisabled?: (row: Record<string, unknown>) => boolean
  /**
   * 展开行：true / 对象注入 type=expand 列；也可只提供 #expand 插槽
   */
  expand?: boolean | TableExpandConfig
  /**
   * 树表配置
   * - true：childrenKey=children + defaultExpandAll
   * - 对象：自定义 childrenKey / defaultExpandAll / indent
   */
  tree?: boolean | TableTreeConfig
  /** 合计行（函数或 { label, columns: { key: 'sum'|'count'|'avg'|fn } }） */
  summary?: TableSummaryConfig
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
  /** 额外工具栏操作（与导出 / 列设置合并） */
  toolbarActions?: TableActionItem[]
  /** 加载态（替代 table-props.loading） */
  loading?: boolean
  /** 空状态文案 */
  emptyText?: string
  /** 首次加载（loading 且无数据）骨架行数 */
  skeletonRows?: number
  /**
   * 数据变更时自动清空勾选（分页 / 搜索刷新后常见需求），默认 true
   * 跨页批量勾选时设为 false
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
  remote: false,
  showIndex: false,
  indexTitle: '#',
  indexWidth: 60,
  selectable: false,
  selectionMultiple: true,
  selectionDisabled: undefined,
  expand: undefined,
  tree: undefined,
  summary: undefined,
  colSettingKey: undefined,
  csvExport: true,
  toolbarActions: () => [],
  loading: false,
  emptyText: '暂无数据',
  skeletonRows: 8,
  clearCheckedOnDataChange: true,
  filterCheckedKeys: undefined,
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
  /** 排序变更（remote 时配合 usePageList.onSorterChange） */
  'update:sorter': [sorter: TableSortState | TableSortState[] | null]
  /** 筛选变更（remote 时配合 usePageList.onFiltersChange） */
  'update:filters': [filters: TableFilterState]
}>()

/** 选中行 key（单选时最多 1 个）；selectable 时由表格托管，页面用 v-model:checked-row-keys */
const checkedRowKeys = defineModel<Array<string | number>>('checkedRowKeys', {
  default: () => [],
})

const tableRef = ref<DataTableInst | null>(null)
const enableColSetting = computed(() => Boolean(props.colSettingKey && props.fields.length))
const enableCsvExport = computed(() => props.csvExport !== false)

/** 首次加载：loading 且无数据 → 骨架；已有数据再刷新 → 表格 loading 遮罩 */
const showSkeleton = computed(() => props.loading && props.data.length === 0)
const overlayLoading = computed(() => props.loading && props.data.length > 0)
const effectiveVirtualScroll = computed(() =>
  props.virtualScroll || (props.flexHeight && props.data.length >= 40),
)

const csvExportConfig = computed<TableCsvExportConfig>(() => {
  if (props.csvExport && typeof props.csvExport === 'object')
    return props.csvExport
  return {}
})
const csvExportFileName = computed(() => csvExportConfig.value.fileName ?? 'export')

/** 导出 + 列设置 + 自定义操作合并为同一组，多项时一个下拉 */
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

  if (props.toolbarActions?.length) {
    if (actions.length)
      actions.push({ key: 'toolbar-custom-divider', label: '', divider: true })
    actions.push(...props.toolbarActions)
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

const showToolbar = computed(() =>
  Boolean(slots.toolbar || slots['toolbar-extra'] || cleanedToolbarActions.value.length),
)

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

function createIndexColumn(): DataTableColumns[number] {
  return {
    key: '__index',
    title: props.indexTitle,
    width: props.indexWidth,
    align: 'center',
    allowExport: false,
    render: (_row, index) => {
      if (!props.showPagination)
        return index + 1
      return (pagination.page - 1) * pagination.pageSize + index + 1
    },
  }
}

function resolveExpandConfig(): TableExpandConfig | null {
  if (props.expand === true)
    return {}
  if (props.expand && typeof props.expand === 'object')
    return props.expand
  if (slots.expand)
    return {}
  return null
}

function createExpandColumn(): DataTableColumns[number] | null {
  const cfg = resolveExpandConfig()
  if (!cfg)
    return null
  return {
    type: 'expand' as const,
    width: cfg.width,
    expandable: cfg.expandable
      ? (row: Record<string, unknown>) => cfg.expandable!(row)
      : undefined,
    renderExpand: (row: Record<string, unknown>, index: number) => {
      if (slots.expand)
        return slots.expand({ row, index })
      return cfg.render?.(row, index) ?? ''
    },
  }
}

const resolvedColumns = computed<DataTableColumns>(() => {
  const cols = withDefaultResizable(
    props.fields.length
      ? toTableColumns(displayFields.value, { remote: props.remote })
      : (props.columns ?? []),
  )

  const prefix: DataTableColumns = []
  if (props.selectable) {
    prefix.push({
      type: 'selection' as const,
      multiple: props.selectionMultiple,
      disabled: props.selectionDisabled
        ? (row: Record<string, unknown>) => props.selectionDisabled!(row)
        : undefined,
    })
  }
  const expandCol = createExpandColumn()
  if (expandCol)
    prefix.push(expandCol)
  if (props.showIndex)
    prefix.push(createIndexColumn())

  return withExportColumnFlags([...prefix, ...cols])
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

const resolvedTree = computed<TableTreeConfig | null>(() => {
  if (!props.tree)
    return null
  if (props.tree === true) {
    return { childrenKey: 'children', defaultExpandAll: true }
  }
  return {
    childrenKey: props.tree.childrenKey ?? 'children',
    defaultExpandAll: props.tree.defaultExpandAll,
    indent: props.tree.indent,
  }
})

function normalizeSorter(
  sorter: DataTableSortState | DataTableSortState[] | null,
): TableSortState | TableSortState[] | null {
  if (!sorter)
    return null
  if (Array.isArray(sorter)) {
    return sorter.map(s => ({
      columnKey: s.columnKey,
      order: s.order,
    }))
  }
  return {
    columnKey: sorter.columnKey,
    order: sorter.order,
  }
}

function onUpdateSorter(sorter: DataTableSortState | DataTableSortState[] | null) {
  emit('update:sorter', normalizeSorter(sorter))
}

function onUpdateFilters(filters: Record<string, string | number | Array<string | number> | null>) {
  emit('update:filters', filters as TableFilterState)
}

function resolveAggregate(
  pageData: Record<string, unknown>[],
  key: string,
  mode: 'sum' | 'count' | 'avg' | ((rows: Record<string, unknown>[]) => import('vue').VNodeChild),
): import('vue').VNodeChild {
  if (typeof mode === 'function')
    return mode(pageData)
  if (mode === 'count')
    return pageData.length
  const nums = pageData
    .map(row => Number(row[key]))
    .filter(n => Number.isFinite(n))
  if (!nums.length)
    return ''
  const sum = nums.reduce((a, b) => a + b, 0)
  if (mode === 'sum')
    return sum
  return Number((sum / nums.length).toFixed(2))
}

const resolvedSummary = computed(() => {
  const cfg = props.summary
  if (!cfg)
    return undefined
  if (typeof cfg === 'function')
    return cfg

  return (pageData: Record<string, unknown>[]) => {
    const row: Record<string, TableSummaryCell> = {}
    const labelKey = cfg.labelKey
      ?? (props.showIndex ? '__index' : Object.keys(cfg.columns)[0])
    if (labelKey) {
      row[labelKey] = { value: cfg.label ?? '合计' }
    }
    for (const [key, mode] of Object.entries(cfg.columns)) {
      row[key] = { value: resolveAggregate(pageData, key, mode) }
    }
    return row
  }
})

/** selectable / tree 注入；loading 由独立 prop 控制 */
const mergedTableProps = computed(() => {
  const base = { ...(props.tableProps || {}) } as Record<string, unknown>
  const tree = resolvedTree.value
  if (tree) {
    if (tree.childrenKey != null)
      base.childrenKey = tree.childrenKey
    if (tree.defaultExpandAll != null)
      base.defaultExpandAll = tree.defaultExpandAll
    if (tree.indent != null)
      base.indent = tree.indent
  }

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

  function walk(list: UnifiedFieldConfig[]) {
    for (const field of list) {
      if (!isFieldInScene(field, 'table'))
        continue
      if (field.children?.length) {
        walk(field.children)
        continue
      }
      const table = field.table === false ? {} : (field.table ?? {})
      map.set(resolveColumnKey(field), { field, table })
    }
  }

  walk(fields)
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

.common-table__toolbar-inner {
  display: flex;
  align-items: center;
  gap: 4px;
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

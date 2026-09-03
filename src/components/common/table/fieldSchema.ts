import type { Component, VNode } from 'vue'
import type { DataTableColumns, FormItemRule } from 'naive-ui'
import { NTag } from 'naive-ui'
import { h } from 'vue'
import { createDefaultSqlSearchValue } from '@/components/common/SqlSearch/utils'
import TableAction from './TableAction.vue'
import type { TableActionsResolver } from './types'

/** ---------- 公共基础 ---------- */

export type FieldScene = 'form' | 'search' | 'table'

export type HiddenValue = boolean | ((model: Record<string, unknown>) => boolean)

/** visible 与 hidden 等价，visible: false 即隐藏 */
export type VisibleValue = HiddenValue

export type NaiveComponentName =
  | 'NInput' | 'NSelect' | 'NDatePicker' | 'NTimePicker' | 'NUpload' | 'NInputNumber'
  | 'NDynamicInput' | 'NDynamicTags' | 'NSwitch' | 'NCheckboxGroup' | 'NRadioGroup'
  | 'NRadio' | 'NRadioButton' | 'NCheckbox' | 'NTransfer' | 'NCascader'
  | 'NTreeSelect' | 'NSlider' | 'NColorPicker' | 'NRate'
  | 'NAutoComplete' | 'NMention' | 'NInputOtp'
  | 'Checkbox' | 'Radio' | 'RadioButton'
  | 'Editor' | 'IconSelect' | 'UserSelect' | 'DeptSelect'
  | 'CronInput' | 'SqlSearch' | 'UploadFile' | 'ImageCropper' | 'file'

/** 表单值为数组的组件（无显式 defaultValue 时使用 []） */
export const ARRAY_VALUE_COMPONENTS = new Set<string>([
  'NDynamicInput',
  'NDynamicTags',
  'NCheckboxGroup',
  'NTransfer',
  'UploadFile',
  'file',
])

export function resolveComponentDefaultValue(
  component?: NaiveComponentName | string | Array<NaiveComponentName | string>,
): unknown | undefined {
  const name = Array.isArray(component) ? String(component[0]) : String(component || '')
  if (ARRAY_VALUE_COMPONENTS.has(name))
    return []
  if (name === 'SqlSearch')
    return createDefaultSqlSearchValue()
  return undefined
}

export interface FieldOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
  listClass?: string
}

/** 表单 / 搜索自定义渲染：(item, model, curValue) */
export type FieldRenderFn = (
  item: unknown,
  model: Record<string, unknown>,
  curData: unknown,
) => VNode | VNode[] | string

/** 控件具名插槽渲染 */
export type FieldSlotFn = (
  item: unknown,
  model: Record<string, unknown>,
  curData: unknown,
) => VNode | string

/** 表格单元格渲染：(row, rowIndex) */
export type TableRenderFn = (
  row: Record<string, unknown>,
  index: number,
) => VNode | string

export interface FieldBind {
  required?: boolean
  hidden?: HiddenValue
  /** 与 hidden 等价，visible: false 即隐藏 */
  visible?: HiddenValue
  hiddenClear?: boolean
  notValidate?: boolean
  defaultValue?: unknown
  message?: string
  label?: string
  title?: string
  pattern?: RegExp | string
  patternType?: string
  fileType?: FormItemRule['type']
  extendRule?: FormItemRule
  extendRules?: FormItemRule[]
  rules?: FormItemRule | FormItemRule[]
  slotName?: string
  render?: FieldRenderFn
  options?: FieldOption[]
  col?: number
  multiple?: boolean
  disabled?: boolean
  readonly?: boolean
  button?: boolean
  /** NDatePicker 时间戳字段后缀，默认 `value` → `{key}value` */
  dateValueSuffix?: string
  [key: string]: unknown
}

/** 设计器导出的 form 表达式字段（defineFields 时会编译为函数） */
export interface FormFieldDesignExprs {
  visibleExpr?: string
  hiddenExpr?: string
  renderExpr?: string
  onChangeExpr?: string
}

/** 表单场景扩展（CommonForm） */
export interface FormFieldConfig extends FormFieldDesignExprs {
  required?: boolean | boolean[]
  hidden?: HiddenValue
  visible?: HiddenValue
  hiddenClear?: boolean
  notValidate?: boolean
  defaultValue?: unknown
  span?: number
  /** 栅格起始列（1 起），与 span 配合定位 */
  colStart?: number
  class?: string
  showFeedback?: boolean
  cols?: number
  bind?: FieldBind | FieldBind[]
  bindItem?: Record<string, unknown> | Array<Record<string, unknown>>
  slot?: Record<string, FieldSlotFn> | Array<Record<string, FieldSlotFn>>
  on?: Record<string, (...args: unknown[]) => void> | Array<Record<string, (...args: unknown[]) => void>>
  render?: FieldRenderFn
}

/** 搜索场景扩展（SearchPanel） */
export interface SearchFieldConfig {
  /** 是否作为搜索项，默认 true（出现在 search 场景时） */
  enabled?: boolean
  defaultValue?: unknown
  /** 占用栅格列数（与 col 等价） */
  span?: number
  /** 占用栅格列数（与 span 等价） */
  col?: number
  bind?: FieldBind | FieldBind[]
  bindItem?: Record<string, unknown>
  slot?: Record<string, FieldSlotFn>
  on?: Record<string, (...args: unknown[]) => void>
  render?: FieldRenderFn
}

/** 表格场景扩展（CommonTable） */
export interface TableFieldConfig {
  /** 列宽 */
  width?: number
  minWidth?: number
  maxWidth?: number
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  /**
   * 列排序
   * - true：跟随 CommonTable.remote（本地 default / 远程 true）
   * - 'local'：强制客户端排序
   * - 'remote'：强制远程排序（仅展示排序图标）
   */
  sortable?: boolean | 'local' | 'remote'
  /**
   * 列筛选
   * - true：跟随 CommonTable.remote
   * - 'local'：客户端筛选（filter: 'default'）
   * - 'remote'：仅 UI，配合 @update:filters
   * - 函数：自定义本地筛选
   */
  filter?: boolean | 'local' | 'remote' | ((value: string | number, row: Record<string, unknown>) => boolean)
  /** 筛选项；未传且 field.options 存在时自动生成 */
  filterOptions?: Array<{ label: string, value: string | number }>
  /** 是否多选筛选，默认 true */
  filterMultiple?: boolean
  ellipsis?: boolean | { tooltip: boolean }
  /** 自定义单元格渲染，优先级高于 format / actions */
  render?: TableRenderFn
  /** 操作列：按行返回按钮配置（渲染 TableAction） */
  actions?: TableActionsResolver
  /** 操作列行内按钮上限，超出收起到「更多」 */
  actionsMax?: number
  /** 是否参与 CSV 导出，默认 true；操作列默认 false */
  allowExport?: boolean
  /**
   * 导出「展示数据」时的文案
   * 有自定义 render 且无法从 format 推导时建议提供
   */
  exportText?: (value: unknown, row: Record<string, unknown>) => string
  /** 设计器导出的导出文案模板，defineFields 时编译为 exportText */
  exportTextValue?: string
  /** 内置格式化：option 映射 / date / datetime */
  format?: 'option' | 'date' | 'datetime' | ((value: unknown, row: Record<string, unknown>) => string)
  /** option 映射时的颜色 */
  tagType?: (value: unknown) => 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'
  /** 设计器导出的固定 tag 类型，defineFields 时编译为 tagType */
  tagTypeValue?: 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning' | string
  /** 列设置中默认是否显示 */
  isShow?: boolean
  /** 不参与列设置（显隐 / 拖拽排序） */
  hideInSetting?: boolean
}

/**
 * 统一字段配置
 *
 * - 不写 form/search/table：默认参与三个场景（仅含基础属性）
 * - 设为 false：该场景排除
 * - 设为对象：该场景启用，并与基础属性合并
 *
 * @example
 * { key: 'name', label: '姓名', component: 'NInput', form: { required: true }, search: { enabled: true }, table: { width: 120 } }
 */
export interface UnifiedFieldConfig {
  id?: string
  key: string | string[]
  label?: string
  title?: string
  component?: NaiveComponentName | string | Array<NaiveComponentName | string>
  options?: FieldOption[] | unknown[]
  type?: string | string[]
  bind?: FieldBind | FieldBind[]
  form?: false | FormFieldConfig
  search?: false | SearchFieldConfig
  table?: false | TableFieldConfig
  /**
   * 多级表头子列（仅 table；有 children 时本节点为分组列，不渲染单元格）
   * @example { key: 'base', label: '基本信息', children: [{ key: 'name', label: '姓名', table: { width: 120 } }] }
   */
  children?: UnifiedFieldConfig[]
  /** 设计器字典类型提示；运行时需自行 useDict 填充 options，或导出前先加载选项 */
  dictType?: string
  /** 设计器可视化联动规则（仅文档/往返用，运行时以 form.visibleExpr 为准） */
  visibilityRule?: unknown
  /**
   * form === false 时的联动表达式往返字段（设计器用）
   * form 启用时应写在 form.visibleExpr 等字段中
   */
  visibleExpr?: string
  hiddenExpr?: string
  renderExpr?: string
  onChangeExpr?: string
}

/** CommonForm 直接传入的表单 config 项（与 toFormConfig 输出一致） */
export type FormConfigItem = {
  id?: string
  label?: string
  title?: string
  key: string | string[]
  required?: boolean | boolean[]
  hidden?: HiddenValue
  visible?: VisibleValue
  hiddenClear?: boolean
  notValidate?: boolean
  defaultValue?: unknown
  component?: NaiveComponentName | string | Array<NaiveComponentName | string>
  options?: unknown | unknown[]
  type?: string | string[]
  on?: Record<string, (...args: unknown[]) => void> | Array<Record<string, (...args: unknown[]) => void>>
  bind?: FieldBind | FieldBind[]
  slot?: Record<string, FieldSlotFn> | Array<Record<string, FieldSlotFn>>
  bindItem?: Record<string, unknown> | Array<Record<string, unknown>>
  render?: FieldRenderFn
  cols?: number
  class?: string
  showFeedback?: boolean
  /** 占几列，如 2 表示跨两列 */
  span?: number
  /** 栅格起始列（1 起） */
  colStart?: number
}

/** @deprecated 请使用 FormConfigItem */
export type ConfigItem = FormConfigItem

/** SearchPanel 直接传入的搜索 config 项（与 toSearchConfig 输出一致） */
export type SearchConfigItem = {
  label?: string
  title?: string
  key: string | string[]
  isSearch?: boolean
  component?: NaiveComponentName | string | Array<NaiveComponentName | string>
  options?: unknown | unknown[]
  type?: string | string[]
  bind?: FieldBind | FieldBind[]
  bindItem?: Record<string, unknown>
  slot?: Record<string, FieldSlotFn>
  on?: Record<string, (...args: unknown[]) => void>
  render?: FieldRenderFn
  /** 占用栅格列数（与 col 等价） */
  span?: number
  /** 占用栅格列数（与 span 等价） */
  col?: number
}

function isSceneEnabled(sceneConfig: false | object | undefined, defaultEnabled = true) {
  if (sceneConfig === false)
    return false
  if (sceneConfig === undefined)
    return defaultEnabled
  return true
}

function mergeBind(base?: FieldBind | FieldBind[], extra?: FieldBind | FieldBind[]) {
  if (!base)
    return extra
  if (!extra)
    return base
  if (Array.isArray(base) || Array.isArray(extra))
    return extra ?? base
  return { ...base, ...extra }
}

/** 是否参与某场景 */
export function isFieldInScene(field: UnifiedFieldConfig, scene: FieldScene): boolean {
  if (scene === 'form')
    return isSceneEnabled(field.form)
  if (scene === 'search')
    return isSceneEnabled(field.search)
  return isSceneEnabled(field.table)
}

/** 转为 CommonForm config */
export function toFormConfig(fields: UnifiedFieldConfig[]): FormConfigItem[] {
  return fields
    .filter(f => isFieldInScene(f, 'form'))
    .map((field) => {
      const form = field.form === false ? {} : (field.form ?? {})
      return {
        id: field.id,
        key: field.key,
        label: field.label ?? field.title,
        title: field.title,
        component: field.component,
        options: field.options,
        type: field.type,
        required: form.required,
        hidden: form.hidden,
        visible: form.visible,
        hiddenClear: form.hiddenClear,
        notValidate: form.notValidate,
        defaultValue: form.defaultValue,
        span: form.span,
        colStart: form.colStart,
        class: form.class,
        showFeedback: form.showFeedback,
        cols: form.cols,
        bind: mergeBind(field.bind, form.bind),
        bindItem: form.bindItem,
        slot: form.slot,
        on: form.on,
        render: form.render,
      }
    })
}

/** 转为 SearchPanel config */
export function toSearchConfig(fields: UnifiedFieldConfig[]): SearchConfigItem[] {
  return fields
    .filter((f) => {
      if (!isFieldInScene(f, 'search'))
        return false
      const search = f.search === false ? undefined : f.search
      return search?.enabled !== false
    })
    .map((field) => {
      const search = field.search === false ? {} : (field.search ?? {})
      return {
        label: field.label ?? field.title,
        title: field.title,
        key: field.key,
        isSearch: true,
        component: field.component,
        options: field.options,
        type: field.type,
        span: search.span,
        col: search.col,
        bind: mergeBind(field.bind, search.bind),
        bindItem: search.bindItem,
        slot: search.slot,
        on: search.on,
        render: search.render,
      }
    })
}

function resolveListClassTagType(
  listClass?: string,
): 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning' | undefined {
  if (!listClass)
    return undefined
  const map: Record<string, 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'> = {
    default: 'default',
    primary: 'primary',
    success: 'success',
    info: 'info',
    warning: 'warning',
    danger: 'error',
    error: 'error',
  }
  return map[listClass]
}

function formatCellValue(
  value: unknown,
  field: UnifiedFieldConfig,
  table: TableFieldConfig,
  row: Record<string, unknown>,
) {
  if (typeof table.format === 'function')
    return table.format(value, row)

  if (table.format === 'option' && field.options) {
    const opts = field.options as FieldOption[]
    const hit = opts.find(o => o.value === value)
    const text = hit?.label ?? String(value ?? '')
    const listClassType = resolveListClassTagType(hit?.listClass)
    if (table.tagType) {
      return h(NTag, { type: table.tagType(value), size: 'small' }, { default: () => text })
    }
    if (listClassType) {
      return h(NTag, { type: listClassType, size: 'small' }, { default: () => text })
    }
    return text
  }

  if (table.format === 'date' && value)
    return new Date(value as string | number).toLocaleDateString()

  if (table.format === 'datetime' && value)
    return new Date(value as string | number).toLocaleString()

  return value ?? ''
}

/** CSV 单元格转义（与 Naive UI formatCsvCell 一致） */
export function escapeCsvCell(value: string) {
  return value.replace(/,/g, '\\,')
}

/**
 * 导出「展示数据」用的纯文本（option 标签、日期格式等）
 * 优先 exportText → format → 原始值
 */
export function formatExportCellValue(
  value: unknown,
  field: UnifiedFieldConfig,
  table: TableFieldConfig,
  row: Record<string, unknown>,
): string {
  if (table.exportText)
    return String(table.exportText(value, row) ?? '')

  if (typeof table.format === 'function')
    return String(table.format(value, row) ?? '')

  if (table.format === 'option' && field.options) {
    const opts = field.options as FieldOption[]
    const hit = opts.find(o => o.value === value)
    return hit?.label ?? String(value ?? '')
  }

  if (table.format === 'date' && value)
    return new Date(value as string | number).toLocaleDateString()

  if (table.format === 'datetime' && value)
    return new Date(value as string | number).toLocaleString()

  if (value == null)
    return ''
  return String(value)
}

export function resolveColumnKey(field: UnifiedFieldConfig): string {
  return typeof field.key === 'string' ? field.key : field.key[0]
}

/** 是否为不参与导出的操作列 */
export function isActionsColumnKey(key: string, label?: string) {
  if (key === 'actions' || key === 'action')
    return true
  if (label === '操作')
    return true
  return false
}

/** 标记 selection / expand / 操作列为不可导出 */
export function withExportColumnFlags(cols: DataTableColumns): DataTableColumns {
  return cols.map((col) => {
    if ('children' in col && col.children) {
      return {
        ...col,
        children: withExportColumnFlags(col.children as DataTableColumns) as typeof col.children,
      }
    }
    if ('type' in col && (col.type === 'selection' || col.type === 'expand'))
      return { ...col, allowExport: false }
    const key = 'key' in col ? String(col.key ?? '') : ''
    const title = 'title' in col && typeof col.title === 'string' ? col.title : undefined
    if (isActionsColumnKey(key, title) || col.allowExport === false)
      return { ...col, allowExport: false }
    return col
  }) as DataTableColumns
}

/** toTableColumns / FormBuilder 共用：已显式处理的 table 键，其余透传为列扩展 */
export const TABLE_COLUMN_HANDLED_KEYS = new Set([
  'width',
  'minWidth',
  'maxWidth',
  'fixed',
  'align',
  'sortable',
  'filter',
  'filterOptions',
  'filterMultiple',
  'ellipsis',
  'allowExport',
  'render',
  'actions',
  'actionsMax',
  'format',
  'tagType',
  'exportText',
  'tagTypeValue',
  'exportTextValue',
  'isShow',
  'hideInSetting',
])

function pickExtraTableColumnProps(table: TableFieldConfig): Record<string, unknown> {
  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(table)) {
    if (TABLE_COLUMN_HANDLED_KEYS.has(key) || value == null || typeof value === 'function')
      continue
    extra[key] = value
  }
  return extra
}

/** 解析列 sorter：local → 'default'，remote → true（仅 UI） */
export function resolveColumnSorter(
  sortable: TableFieldConfig['sortable'],
  remote = false,
): 'default' | true | undefined {
  if (!sortable)
    return undefined
  if (sortable === 'local')
    return 'default'
  if (sortable === 'remote')
    return true
  return remote ? true : 'default'
}

/** 解析列 filter：local → 'default'，remote → true（仅 UI） */
export function resolveColumnFilter(
  filter: TableFieldConfig['filter'],
  remote = false,
): TableFieldConfig['filter'] | 'default' | true | undefined {
  if (!filter)
    return undefined
  if (typeof filter === 'function')
    return filter
  if (filter === 'local')
    return 'default'
  if (filter === 'remote')
    return true
  return remote ? true : 'default'
}

function resolveFilterOptions(
  field: UnifiedFieldConfig,
  table: TableFieldConfig,
): Array<{ label: string, value: string | number }> | undefined {
  if (table.filterOptions?.length)
    return table.filterOptions
  if (!table.filter)
    return undefined
  const opts = field.options as FieldOption[] | undefined
  if (!opts?.length)
    return undefined
  return opts
    .filter(o => o && (typeof o.value === 'string' || typeof o.value === 'number'))
    .map(o => ({ label: o.label, value: o.value as string | number }))
}

function fieldToColumn(
  field: UnifiedFieldConfig,
  remote: boolean,
): DataTableColumns[number] {
  const table = field.table === false ? {} : (field.table ?? {})
  const colKey = resolveColumnKey(field)
  const label = field.label ?? field.title
  const childFields = field.children?.filter(f => isFieldInScene(f, 'table')) ?? []

  if (childFields.length) {
    return {
      key: colKey,
      title: label ?? colKey,
      align: table.align,
      fixed: table.fixed,
      children: childFields.map(child => fieldToColumn(child, remote)),
    } as DataTableColumns[number]
  }

  const isActions = Boolean(table.actions) || isActionsColumnKey(colKey, label)
  const filterOptions = resolveFilterOptions(field, table)
  const rawFilter = resolveColumnFilter(table.filter, remote)
  /** 无选项且非自定义函数时不挂 filter，避免空筛选菜单 */
  const filter = rawFilter && (typeof table.filter === 'function' || (filterOptions?.length ?? 0) > 0)
    ? rawFilter
    : undefined
  return {
    key: colKey,
    title: label ?? colKey,
    width: table.width,
    minWidth: table.minWidth,
    maxWidth: table.maxWidth,
    fixed: table.fixed,
    align: table.align,
    sorter: resolveColumnSorter(table.sortable, remote),
    filter,
    filterOptions: filter ? filterOptions : undefined,
    filterMultiple: table.filterMultiple,
    ellipsis: table.ellipsis,
    allowExport: table.allowExport ?? !isActions,
    ...pickExtraTableColumnProps(table),
    render: (row: Record<string, unknown>, index: number) => {
      if (table.render)
        return table.render(row, index)
      if (table.actions) {
        return h(TableAction, {
          row,
          actions: table.actions(row),
          max: table.actionsMax,
        })
      }
      return formatCellValue(row[colKey], field, table, row)
    },
  } as DataTableColumns[number]
}

/** 转为 Naive UI DataTable columns（支持多级表头 children） */
export function toTableColumns(
  fields: UnifiedFieldConfig[],
  options?: { remote?: boolean },
): DataTableColumns {
  const remote = options?.remote ?? false
  return fields
    .filter(f => isFieldInScene(f, 'table'))
    .map(field => fieldToColumn(field, remote)) as DataTableColumns
}

/** 从统一配置提取搜索默认值 */
export function extractSearchDefaults(fields: UnifiedFieldConfig[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const field of fields) {
    if (!isFieldInScene(field, 'search'))
      continue
    const search = field.search === false ? {} : (field.search ?? {})
    const bind = mergeBind(field.bind, search.bind) as FieldBind | FieldBind[] | undefined
    const bindDefault = Array.isArray(bind) ? bind[0]?.defaultValue : bind?.defaultValue
    const defaultValue = search.defaultValue ?? bindDefault ?? resolveArrayAwareDefault(field.component, bind)

    if (Array.isArray(field.key)) {
      field.key.forEach((k, i) => {
        const dv = Array.isArray(bind) ? bind[i]?.defaultValue : defaultValue
        if (dv !== undefined)
          defaults[k] = dv
      })
    }
    else if (defaultValue !== undefined) {
      defaults[field.key] = defaultValue
    }
  }
  return defaults
}

function resolveMergedBindMultiple(bind: FieldBind | FieldBind[] | undefined): boolean | undefined {
  const single = Array.isArray(bind) ? bind[0] : bind
  return single?.multiple
}

/** 多选类组件默认 []（含 UserSelect 默认多选） */
function resolveArrayAwareDefault(
  component: UnifiedFieldConfig['component'],
  bind: FieldBind | FieldBind[] | undefined,
): unknown | undefined {
  const base = resolveComponentDefaultValue(component)
  if (base !== undefined)
    return base
  const name = Array.isArray(component) ? String(component[0]) : String(component || '')
  const multiple = resolveMergedBindMultiple(bind)
  if (multiple === true)
    return []
  if (name === 'UserSelect' && multiple !== false)
    return []
  return undefined
}

/** 从统一配置提取表单默认值 */
export function extractFormDefaults(fields: UnifiedFieldConfig[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const field of fields) {
    if (!isFieldInScene(field, 'form'))
      continue
    const form = field.form === false ? {} : (field.form ?? {})
    const bind = mergeBind(field.bind, form.bind) as FieldBind | FieldBind[] | undefined
    const bindDefault = Array.isArray(bind) ? bind[0]?.defaultValue : bind?.defaultValue
    const defaultValue = form.defaultValue ?? bindDefault ?? resolveArrayAwareDefault(field.component, bind)

    if (Array.isArray(field.key)) {
      field.key.forEach((k, i) => {
        const dv = Array.isArray(bind) ? bind[i]?.defaultValue : defaultValue
        if (dv !== undefined)
          defaults[k] = dv
      })
    }
    else if (defaultValue !== undefined) {
      defaults[field.key] = defaultValue
    }
  }
  return defaults
}

function compileDesignExpr(
  expr: string,
  fallback = false,
): (model: Record<string, unknown>) => boolean {
  const trimmed = expr.trim()
  if (!trimmed)
    return () => true
  try {
    // eslint-disable-next-line no-new-func
    return new Function('model', `return (${trimmed})`) as (model: Record<string, unknown>) => boolean
  }
  catch {
    return () => fallback
  }
}

function hydrateFieldDesignExprs(field: UnifiedFieldConfig): UnifiedFieldConfig {
  if (field.bind && typeof field.bind === 'object' && !Array.isArray(field.bind)) {
    const bind = { ...field.bind } as FieldBind
    if (typeof bind.pattern === 'string' && bind.pattern) {
      try {
        bind.pattern = new RegExp(bind.pattern)
      }
      catch {
        delete bind.pattern
      }
    }
    field.bind = bind
  }

  if (field.form != null && field.form !== false) {
    const form = { ...field.form }
    if (form.visibleExpr && typeof form.visible !== 'function') {
      form.visible = compileDesignExpr(form.visibleExpr, false)
      delete form.visibleExpr
    }
    if (form.hiddenExpr && typeof form.hidden !== 'function') {
      form.hidden = compileDesignExpr(form.hiddenExpr, false)
      delete form.hiddenExpr
    }
    if (form.renderExpr?.trim() && typeof form.render !== 'function') {
      try {
        // eslint-disable-next-line no-new-func
        form.render = new Function('item', 'model', 'curData', `return (${form.renderExpr})`) as FormFieldConfig['render']
      }
      catch {
        // ignore
      }
      delete form.renderExpr
    }
    if (form.onChangeExpr?.trim()) {
      try {
        // eslint-disable-next-line no-new-func
        const handler = new Function('value', 'model', 'item', form.onChangeExpr) as (...args: unknown[]) => void
        form.on = { ...(form.on || {}), change: handler }
      }
      catch {
        // ignore
      }
      delete form.onChangeExpr
    }
    field.form = form
  }

  if (field.table != null && field.table !== false) {
    const table = { ...field.table }
    if (table.tagTypeValue && typeof table.tagType !== 'function') {
      const type = table.tagTypeValue as 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'
      table.tagType = () => type
      delete table.tagTypeValue
    }
    if (table.exportTextValue && typeof table.exportText !== 'function') {
      const template = table.exportTextValue
      table.exportText = (value: unknown) => template.replace(/\{value\}/g, String(value ?? ''))
      delete table.exportTextValue
    }
    field.table = table
  }

  return field
}

/**
 * 创建页面级统一字段配置（便于 IDE 提示）
 * 会将设计器导出的 visibleExpr / tagTypeValue 等编译为运行时函数
 */
export function defineFields(fields: UnifiedFieldConfig[]) {
  return fields.map(field => hydrateFieldDesignExprs({ ...field }))
}

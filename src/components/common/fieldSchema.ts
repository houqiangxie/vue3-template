import type { Component, VNode } from 'vue'
import type { DataTableColumns, FormItemRule } from 'naive-ui'
import { NTag } from 'naive-ui'
import { h } from 'vue'

/** ---------- 公共基础 ---------- */

export type FieldScene = 'form' | 'search' | 'table'

export type HiddenValue = boolean | ((model: Record<string, unknown>) => boolean)

export type NaiveComponentName =
  | 'NInput' | 'NSelect' | 'NDatePicker' | 'NUpload' | 'NInputNumber'
  | 'NDynamicInput' | 'NSwitch' | 'NCheckboxGroup' | 'NRadioGroup'
  | 'NRadio' | 'NRadioButton' | 'NCheckbox' | 'NTransfer' | 'NCascader'
  | 'NTreeSelect' | 'NSlider' | 'NColorPicker' | 'NRate'
  | 'Checkbox' | 'Radio' | 'RadioButton'

export interface FieldOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

/** 表单 / 搜索自定义渲染：(item, model, curValue) */
export type FieldRenderFn = (
  item: unknown,
  model: Record<string, unknown>,
  curData: unknown,
) => VNode | VNode[] | string

/** 表格单元格渲染：(row, rowIndex) */
export type TableRenderFn = (
  row: Record<string, unknown>,
  index: number,
) => VNode | string

export interface FieldBind {
  required?: boolean
  hidden?: HiddenValue
  visible?: HiddenValue
  hiddenClear?: boolean
  notValidate?: boolean
  defaultValue?: unknown
  message?: string
  pattern?: RegExp
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
  dateValueSuffix?: string
  [key: string]: unknown
}

/** 表单场景扩展（CommonForm） */
export interface FormFieldConfig {
  required?: boolean | boolean[]
  hidden?: HiddenValue
  visible?: HiddenValue
  hiddenClear?: boolean
  notValidate?: boolean
  defaultValue?: unknown
  span?: number
  class?: string
  showFeedback?: boolean
  cols?: number
  bind?: FieldBind | FieldBind[]
  bindItem?: Record<string, unknown> | Array<Record<string, unknown>>
  slot?: Record<string, (...args: unknown[]) => unknown> | Array<Record<string, (...args: unknown[]) => unknown>>
  on?: Record<string, (...args: unknown[]) => void> | Array<Record<string, (...args: unknown[]) => void>>
  render?: FieldRenderFn
}

/** 搜索场景扩展（SearchPanel） */
export interface SearchFieldConfig {
  /** 是否作为搜索项，默认 true（出现在 search 场景时） */
  enabled?: boolean
  defaultValue?: unknown
  bind?: FieldBind | FieldBind[]
  bindItem?: Record<string, unknown>
  slot?: Record<string, (...args: unknown[]) => unknown>
  on?: Record<string, (...args: unknown[]) => void>
  render?: FieldRenderFn
}

/** 表格场景扩展（CustomTable） */
export interface TableFieldConfig {
  /** 列宽 */
  width?: number
  minWidth?: number
  maxWidth?: number
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  ellipsis?: boolean | { tooltip: boolean }
  /** 自定义单元格渲染，优先级高于 format */
  render?: TableRenderFn
  /** 内置格式化：option 映射 / date / datetime */
  format?: 'option' | 'date' | 'datetime' | ((value: unknown, row: Record<string, unknown>) => string)
  /** option 映射时的颜色 */
  tagType?: (value: unknown) => 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'
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
}

export type FormConfigItem = {
  id?: string
  label?: string
  title?: string
  key: string | string[]
  required?: boolean | boolean[]
  hidden?: HiddenValue
  visible?: HiddenValue
  hiddenClear?: boolean
  notValidate?: boolean
  defaultValue?: unknown
  component?: NaiveComponentName | string | Array<NaiveComponentName | string>
  options?: unknown | unknown[]
  type?: string | string[]
  on?: Record<string, (...args: unknown[]) => void> | Array<Record<string, (...args: unknown[]) => void>>
  bind?: FieldBind | FieldBind[]
  slot?: Record<string, (...args: unknown[]) => unknown> | Array<Record<string, (...args: unknown[]) => unknown>>
  bindItem?: Record<string, unknown> | Array<Record<string, unknown>>
  render?: FieldRenderFn
  cols?: number
  class?: string
  showFeedback?: boolean
  span?: number
}

export type SearchConfigItem = {
  label?: string
  title?: string
  key: string | string[]
  isSearch?: boolean
  component?: string | string[]
  options?: unknown | unknown[]
  type?: string | string[]
  bind?: FieldBind | FieldBind[]
  bindItem?: Record<string, unknown>
  slot?: Record<string, (...args: unknown[]) => unknown>
  on?: Record<string, (...args: unknown[]) => void>
  render?: FieldRenderFn
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
        bind: mergeBind(field.bind, search.bind),
        bindItem: search.bindItem,
        slot: search.slot,
        on: search.on,
        render: search.render,
      }
    })
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
    if (table.tagType) {
      return h(NTag, { type: table.tagType(value), size: 'small' }, { default: () => text })
    }
    return text
  }

  if (table.format === 'date' && value)
    return new Date(value as string | number).toLocaleDateString()

  if (table.format === 'datetime' && value)
    return new Date(value as string | number).toLocaleString()

  return value ?? ''
}

function resolveColumnKey(field: UnifiedFieldConfig): string {
  return typeof field.key === 'string' ? field.key : field.key[0]
}

/** 转为 Naive UI DataTable columns */
export function toTableColumns(fields: UnifiedFieldConfig[]): DataTableColumns {
  return fields
    .filter(f => isFieldInScene(f, 'table'))
    .map((field) => {
      const table = field.table === false ? {} : (field.table ?? {})
      const colKey = resolveColumnKey(field)
      return {
        key: colKey,
        title: field.label ?? field.title ?? colKey,
        width: table.width,
        minWidth: table.minWidth,
        maxWidth: table.maxWidth,
        fixed: table.fixed,
        align: table.align,
        sorter: table.sortable ? 'default' : undefined,
        ellipsis: table.ellipsis,
        render: (row: Record<string, unknown>, index: number) => {
          if (table.render)
            return table.render(row, index)
          return formatCellValue(row[colKey], field, table, row)
        },
      }
    })
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
    const defaultValue = search.defaultValue ?? bindDefault

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

/** 从统一配置提取表单默认值 */
export function extractFormDefaults(fields: UnifiedFieldConfig[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const field of fields) {
    if (!isFieldInScene(field, 'form'))
      continue
    const form = field.form === false ? {} : (field.form ?? {})
    const bind = mergeBind(field.bind, form.bind) as FieldBind | FieldBind[] | undefined
    const bindDefault = Array.isArray(bind) ? bind[0]?.defaultValue : bind?.defaultValue
    const defaultValue = form.defaultValue ?? bindDefault

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

/** 创建页面级统一字段配置（便于 IDE 提示） */
export function defineFields(fields: UnifiedFieldConfig[]) {
  return fields
}

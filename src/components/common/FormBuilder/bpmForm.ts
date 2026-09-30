import type { BuilderField } from './types'
import { DISPLAY_ONLY_COMPONENTS } from '@/components/common/table/fieldSchema'
import {
  normalizeImportedField,
  parseImportedFields,
  toExportFields,
} from './serialize'

export const BPM_FORM_ENGINE = 'formBuilder' as const

export type BpmFormConf = {
  engine?: typeof BPM_FORM_ENGINE
  version?: number
  formCols?: number
  labelWidth?: number | string
  [key: string]: unknown
}

export type BpmFormPackOptions = {
  formCols?: number
  labelWidth?: number | string
}

export type BpmFormFieldMeta = {
  field: string
  title: string
  type?: string
  required?: boolean
  /** 规范化后的组件语义，便于下游按能力过滤 */
  kind?: BpmFieldKind
  options?: Array<{ label: string, value: unknown }>
}

export type BpmFieldKind =
  | 'input'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'switch'
  | 'upload'
  | 'editor'
  | 'user'
  | 'dept'
  | 'table'
  | 'display'
  | 'other'

/** 是否为 FormBuilder 引擎存储的流程表单 */
export function isFormBuilderConf(conf: string | Record<string, any> | null | undefined): boolean {
  if (!conf)
    return false
  try {
    const obj = typeof conf === 'string' ? (conf ? JSON.parse(conf) : {}) : conf
    return obj?.engine === BPM_FORM_ENGINE
  }
  catch {
    return false
  }
}

export function parseBpmFormConf(
  conf: string | Record<string, any> | null | undefined,
): BpmFormConf {
  try {
    const obj = typeof conf === 'string' ? (conf ? JSON.parse(conf) : {}) : (conf || {})
    return obj && typeof obj === 'object' ? obj as BpmFormConf : {}
  }
  catch {
    return {}
  }
}

/** BuilderField → 后端 FormVO.conf / fields */
export function packBpmForm(
  fields: BuilderField[],
  formColsOrOptions: number | BpmFormPackOptions = 2,
): { conf: string, fields: string[] } {
  const options = typeof formColsOrOptions === 'number'
    ? { formCols: formColsOrOptions }
    : (formColsOrOptions || {})
  const formCols = options.formCols && options.formCols > 0 ? options.formCols : 2
  const exported = toExportFields(fields)
  const conf: BpmFormConf = {
    engine: BPM_FORM_ENGINE,
    version: 1,
    formCols,
  }
  if (options.labelWidth != null && options.labelWidth !== '')
    conf.labelWidth = options.labelWidth
  return {
    conf: JSON.stringify(conf),
    fields: exported.map(f => JSON.stringify(f)),
  }
}

/** 后端 FormVO → 设计器字段（兼容遗留 form-create 规则结构） */
export function unpackBpmForm(
  conf: string | Record<string, any> | null | undefined,
  fields: Array<string | Record<string, any>> | null | undefined,
): { fields: BuilderField[], formCols: number, labelWidth: number | string } {
  const parsed = parseBpmFormConf(conf)
  const formCols = typeof parsed.formCols === 'number' && parsed.formCols > 0 ? parsed.formCols : 2
  const labelWidth = parsed.labelWidth ?? 100

  const rawList = (fields || []).map((f) => {
    if (typeof f === 'string') {
      try {
        return JSON.parse(f)
      }
      catch {
        return null
      }
    }
    return f
  }).filter(Boolean) as Record<string, any>[]

  if (!rawList.length)
    return { fields: [], formCols, labelWidth }

  // FormBuilder / UnifiedFieldConfig
  if (rawList.some(item => item.key || item.component)) {
    try {
      return { fields: parseImportedFields(rawList), formCols, labelWidth }
    }
    catch {
      return {
        fields: rawList.map(item => normalizeImportedField(item as any)),
        formCols,
        labelWidth,
      }
    }
  }

  // 遗留 form-create：{ field, title, type, $required, options, props }
  const converted = rawList.map((rule) => {
    const mapped = mapLegacyRule(rule)
    return normalizeImportedField(mapped as any)
  })
  return { fields: converted, formCols, labelWidth }
}

function mapLegacyRule(rule: Record<string, any>) {
  const type = String(rule.type || '')
  const component = mapLegacyTypeToComponent(type)
  const bind: Record<string, unknown> = { ...(rule.props || {}) }
  if (type === 'textarea')
    bind.type = 'textarea'
  if (type === 'UploadImg' || type === 'uploadImg') {
    bind.fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    bind.limit = bind.limit ?? 1
  }
  return {
    key: rule.field || rule.key,
    label: rule.title || rule.label || rule.field,
    component,
    options: rule.options,
    form: {
      required: Boolean(rule.$required ?? rule.required),
      span: 1,
      notValidate: DISPLAY_ONLY_COMPONENTS.has(component),
      showFeedback: !DISPLAY_ONLY_COMPONENTS.has(component),
    },
    search: false,
    table: false,
    bind,
  }
}

function mapLegacyTypeToComponent(type?: string): string {
  const map: Record<string, string> = {
    input: 'NInput',
    textarea: 'NInput',
    inputNumber: 'NInputNumber',
    select: 'NSelect',
    DictSelect: 'NSelect',
    radio: 'NRadioGroup',
    checkbox: 'NCheckboxGroup',
    switch: 'NSwitch',
    datePicker: 'NDatePicker',
    timePicker: 'NTimePicker',
    cascader: 'NCascader',
    treeSelect: 'NTreeSelect',
    rate: 'NRate',
    slider: 'NSlider',
    colorPicker: 'NColorPicker',
    upload: 'UploadFile',
    UploadFile: 'UploadFile',
    UploadImg: 'UploadFile',
    uploadImg: 'UploadFile',
    Editor: 'Editor',
    editor: 'Editor',
    UserSelect: 'UserSelect',
    DeptSelect: 'DeptSelect',
    divider: 'FormDivider',
    alert: 'FormAlert',
    html: 'FormHtml',
    span: 'FormHtml',
    text: 'FormHtml',
  }
  return map[type || ''] || 'NInput'
}

/** 将 FormBuilder / form-create 组件名归一为能力语义 */
export function normalizeBpmFieldKind(type?: string): BpmFieldKind {
  const t = String(type || '')
  if (DISPLAY_ONLY_COMPONENTS.has(t))
    return 'display'
  if (['NInputNumber', 'inputNumber', 'el-input-number'].includes(t))
    return 'number'
  if (['NSelect', 'NCascader', 'NTreeSelect', 'NTransfer', 'NAutoComplete', 'select', 'DictSelect', 'cascader', 'treeSelect'].includes(t))
    return 'select'
  if (['NCheckboxGroup', 'NCheckbox', 'Checkbox', 'checkbox'].includes(t))
    return 'checkbox'
  if (['NRadioGroup', 'NRadio', 'NRadioButton', 'Radio', 'RadioButton', 'radio'].includes(t))
    return 'radio'
  if (['NDatePicker', 'datePicker'].includes(t))
    return 'date'
  if (['NTimePicker', 'timePicker'].includes(t))
    return 'time'
  if (['NSwitch', 'switch'].includes(t))
    return 'switch'
  if (['UploadFile', 'NUpload', 'ImageCropper', 'file', 'upload', 'UploadImg', 'uploadImg'].includes(t))
    return 'upload'
  if (['Editor', 'editor'].includes(t))
    return 'editor'
  if (['UserSelect'].includes(t))
    return 'user'
  if (['DeptSelect'].includes(t))
    return 'dept'
  if (['FormTable', 'NDynamicInput', 'tableForm', 'subForm'].includes(t))
    return 'table'
  if (['NInput', 'NMention', 'NInputOtp', 'NDynamicTags', 'input', 'textarea'].includes(t))
    return 'input'
  return 'other'
}

export function isDigitalBpmFieldType(type?: string) {
  return normalizeBpmFieldKind(type) === 'number'
}

export function isMultiSourceBpmFieldType(type?: string) {
  const kind = normalizeBpmFieldKind(type)
  return kind === 'select' || kind === 'checkbox'
}

/**
 * 递归解析单条字段规则元数据（FormBuilder 或遗留 form-create）
 * 供 BPM 节点字段权限等场景使用；跳过纯展示组件。
 */
export function parseFormFields(
  rule: Record<string, any>,
  fields: Array<{ field: string, title: string, type?: string, required?: boolean, kind?: BpmFieldKind, options?: Array<{ label: string, value: unknown }>, [key: string]: any }> = [],
  parentTitle = '',
): BpmFormFieldMeta[] {
  // FormBuilder / UnifiedFieldConfig
  if (rule.key || rule.component) {
    const field = String(rule.key || '')
    const tempTitle = rule.label || field
    const type = rule.component
    const isTable = String(type || '') === 'FormTable'
    // 明细表本身不进权限列表，只收集行内子字段
    if (field && tempTitle && !DISPLAY_ONLY_COMPONENTS.has(String(type || '')) && !isTable) {
      const title = parentTitle ? `${parentTitle}.${tempTitle}` : tempTitle
      fields.push({
        field,
        title,
        type,
        kind: normalizeBpmFieldKind(type),
        required: Boolean(rule.form && rule.form !== false && rule.form.required),
        options: Array.isArray(rule.options) ? rule.options : undefined,
      })
    }
    if (rule.children && Array.isArray(rule.children))
      rule.children.forEach((child: any) => parseFormFields(child, fields, isTable ? tempTitle : (tempTitle || parentTitle)))
    return fields
  }

  const { type, field, $required, title: tempTitle, children, options } = rule
  if (field && tempTitle && !DISPLAY_ONLY_COMPONENTS.has(String(type || ''))) {
    const title = parentTitle ? `${parentTitle}.${tempTitle}` : tempTitle
    fields.push({
      field,
      title,
      type,
      kind: normalizeBpmFieldKind(type),
      required: Boolean($required),
      options: Array.isArray(options) ? options : undefined,
    })
  }
  if (children && Array.isArray(children))
    children.forEach(child => parseFormFields(child, fields, tempTitle || parentTitle))
  return fields
}

/** 解析流程表单字段元数据（节点权限 / 标题摘要 / 预览标签） */
export function listBpmFormFieldMeta(
  fields: Array<string | Record<string, any>> | null | undefined,
): BpmFormFieldMeta[] {
  const result: BpmFormFieldMeta[] = []
  for (const raw of fields || []) {
    let rule: Record<string, any>
    try {
      rule = typeof raw === 'string' ? JSON.parse(raw) : raw
    }
    catch {
      continue
    }
    parseFormFields(rule, result)
  }
  return result
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolveOptionLabel(
  options: Array<{ label?: string, value?: unknown }> | undefined,
  value: unknown,
): string {
  if (!options?.length)
    return value == null ? '' : String(value)
  if (Array.isArray(value)) {
    return value
      .map(v => options.find(o => o.value === v || String(o.value) === String(v))?.label ?? String(v))
      .join('、')
  }
  return options.find(o => o.value === value || String(o.value) === String(value))?.label
    ?? (value == null ? '' : String(value))
}

function asUrlList(variable: unknown): string[] {
  if (!variable)
    return []
  if (Array.isArray(variable)) {
    return variable.flatMap((item) => {
      if (typeof item === 'string')
        return [item]
      if (item && typeof item === 'object') {
        const url = (item as any).url || (item as any).src || (item as any).response?.url
        return url ? [String(url)] : []
      }
      return []
    })
  }
  if (typeof variable === 'string')
    return [variable]
  return []
}

/** 打印场景：把字段值格式化为可读 HTML / 文本 */
export function formatBpmPrintValue(
  field: Record<string, any>,
  variable: unknown,
): string {
  const type = field.component || field.type
  const kind = normalizeBpmFieldKind(type)
  if (kind === 'display')
    return ''
  if (kind === 'table') {
    if (!Array.isArray(variable) || !variable.length)
      return ''
    const children = Array.isArray(field.children) ? field.children : []
    return variable.map((row: any, index: number) => {
      if (!children.length)
        return `${index + 1}. ${escapeHtml(JSON.stringify(row ?? {}))}`
      const parts = children.map((child: any) => {
        const key = child.key
        const label = child.label || child.title || key
        const cell = formatBpmPrintValue(child, row?.[key])
        return `${escapeHtml(String(label))}：${cell}`
      }).join('；')
      return `${index + 1}. ${parts}`
    }).join('<br/>')
  }
  if (kind === 'upload') {
    const urls = asUrlList(variable)
    if (!urls.length)
      return ''
    const looksImage = urls.every(u => /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(u)
      || String(type).includes('Img')
      || String(type) === 'ImageCropper')
    if (looksImage) {
      return urls.map(u => `<img src="${escapeHtml(u)}" style="max-width:600px;max-height:240px;margin:4px;" />`).join('')
    }
    return urls.map(u => `<a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u)}</a>`).join('<br/>')
  }
  if (kind === 'select' || kind === 'radio' || kind === 'checkbox') {
    const options = field.options || field.bind?.options
    return resolveOptionLabel(options, variable)
  }
  if (kind === 'switch') {
    if (variable === true || variable === 1 || variable === '1')
      return '是'
    if (variable === false || variable === 0 || variable === '0')
      return '否'
  }
  if (variable == null)
    return ''
  if (typeof variable === 'object')
    return escapeHtml(JSON.stringify(variable))
  return escapeHtml(String(variable))
}

type DictResolvableField = {
  options?: unknown
  dictType?: string
  _dictType?: string
  children?: DictResolvableField[]
}

function collectDictTypes(fields: DictResolvableField[], out: Set<string>) {
  for (const f of fields) {
    const dictType = String(f.dictType || f._dictType || '').trim()
    if (dictType)
      out.add(dictType)
    if (Array.isArray(f.children) && f.children.length)
      collectDictTypes(f.children, out)
  }
}

function applyDictOptions<T extends DictResolvableField>(
  fields: T[],
  dictMap: Map<string, Array<{ label: string, value: string }>>,
): T[] {
  return fields.map((f) => {
    let next: T = f
    const dictType = String(f.dictType || f._dictType || '').trim()
    if (dictType && !(Array.isArray(f.options) && f.options.length)) {
      next = { ...f, options: dictMap.get(dictType) || [] }
    }
    if (Array.isArray(next.children) && next.children.length) {
      const children = applyDictOptions(next.children, dictMap)
      if (children !== next.children)
        next = { ...next, children }
    }
    return next
  })
}

/**
 * 按 dictType 填充 options（已有 options 时不覆盖；含 FormTable children）
 * 供 BPM 运行时 / 打印等场景使用。
 */
export async function resolveFieldDictOptions<T extends DictResolvableField>(
  fields: T[],
  fetchDict: (dictType: string) => Promise<Array<{ label: string, value: string }>>,
): Promise<T[]> {
  const needTypes = new Set<string>()
  collectDictTypes(fields, needTypes)
  if (!needTypes.size)
    return fields

  const dictMap = new Map<string, Array<{ label: string, value: string }>>()
  await Promise.all([...needTypes].map(async (type) => {
    try {
      dictMap.set(type, await fetchDict(type))
    }
    catch {
      dictMap.set(type, [])
    }
  }))

  return applyDictOptions(fields, dictMap)
}

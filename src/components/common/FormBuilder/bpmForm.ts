import type { BuilderField } from './types'
import { DISPLAY_ONLY_COMPONENTS } from '@/components/common/table/fieldSchema'
import {
  normalizeImportedField,
  parseImportedFields,
  toExportFields,
} from './serialize'

export const BPM_FORM_ENGINE = 'formBuilder' as const

/** Naive UI NForm 仅支持 left / top；遗留 form-create 的 right 会归一为 left */
export type FormLabelPlacement = 'left' | 'top'
export type FormSize = 'small' | 'medium' | 'large'

/** 表单级配置（对齐 flowable FcDesigner「表单配置」常用项） */
export type BpmFormSettings = {
  formCols: number
  labelWidth: number | string
  labelPlacement: FormLabelPlacement
  size: FormSize
  labelSuffix: string
  showRequireMark: boolean
  /** 显示校验错误信息（对齐 form-create showMessage） */
  showFeedback: boolean
  showSubmitBtn: boolean
  showResetBtn: boolean
  /** 表单事件函数体（对齐 form-create `_event` / FnConfig） */
  onSubmitExpr?: string
  onResetExpr?: string
  onCreatedExpr?: string
  onMountedExpr?: string
  onChangeExpr?: string
}

export const DEFAULT_BPM_FORM_SETTINGS: BpmFormSettings = {
  formCols: 2,
  labelWidth: 100,
  labelPlacement: 'left',
  size: 'medium',
  labelSuffix: '',
  showRequireMark: true,
  showFeedback: true,
  showSubmitBtn: false,
  showResetBtn: false,
}

const FORM_EVENT_KEYS = [
  'onSubmitExpr',
  'onResetExpr',
  'onCreatedExpr',
  'onMountedExpr',
  'onChangeExpr',
] as const

type FormEventKey = typeof FORM_EVENT_KEYS[number]

function normalizeEventExpr(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function pickEventExprs(
  source: Record<string, unknown> | null | undefined,
): Partial<Pick<BpmFormSettings, FormEventKey>> {
  if (!source)
    return {}
  const out: Partial<Pick<BpmFormSettings, FormEventKey>> = {}
  for (const key of FORM_EVENT_KEYS) {
    const v = normalizeEventExpr(source[key])
    if (v)
      out[key] = v
  }
  return out
}

/** 兼容 form-create option._event / event 中的函数字符串 */
function pickLegacyEventExprs(
  parsed: BpmFormConf,
): Partial<Pick<BpmFormSettings, FormEventKey>> {
  const raw = (parsed._event || parsed.event) as Record<string, unknown> | undefined
  if (!raw || typeof raw !== 'object')
    return {}
  const map: Record<string, FormEventKey> = {
    onSubmit: 'onSubmitExpr',
    onReset: 'onResetExpr',
    onCreated: 'onCreatedExpr',
    onMounted: 'onMountedExpr',
    onChange: 'onChangeExpr',
  }
  const out: Partial<Pick<BpmFormSettings, FormEventKey>> = {}
  for (const [legacy, ours] of Object.entries(map)) {
    const body = normalizeEventExpr(raw[legacy])
    if (body)
      out[ours] = body
  }
  return out
}

export type BpmFormConf = {
  engine?: typeof BPM_FORM_ENGINE
  version?: number
  formCols?: number
  labelWidth?: number | string
  labelPlacement?: FormLabelPlacement
  size?: FormSize
  labelSuffix?: string
  showRequireMark?: boolean
  showFeedback?: boolean
  showSubmitBtn?: boolean
  showResetBtn?: boolean
  onSubmitExpr?: string
  onResetExpr?: string
  onCreatedExpr?: string
  onMountedExpr?: string
  onChangeExpr?: string
  [key: string]: unknown
}

export type BpmFormPackOptions = Partial<BpmFormSettings>

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

function normalizeLabelPlacement(value: unknown): FormLabelPlacement {
  if (value === 'top' || value === 'left')
    return value
  // Element Plus form-create：right → Naive left
  if (value === 'right')
    return 'left'
  return DEFAULT_BPM_FORM_SETTINGS.labelPlacement
}

function normalizeFormSize(value: unknown): FormSize {
  if (value === 'small' || value === 'medium' || value === 'large')
    return value
  // Element Plus form-create: default → Naive medium
  if (value === 'default')
    return 'medium'
  return DEFAULT_BPM_FORM_SETTINGS.size
}

function normalizeLabelWidth(value: unknown): number | string {
  if (typeof value === 'number' && Number.isFinite(value))
    return value
  if (typeof value === 'string' && value.trim())
    return value
  return DEFAULT_BPM_FORM_SETTINGS.labelWidth
}

/** 从 FormBuilder conf 或遗留 form-create option 解析表单级设置 */
export function resolveBpmFormSettings(
  conf: string | Record<string, any> | null | undefined,
): BpmFormSettings {
  const parsed = parseBpmFormConf(conf)
  // form-create：option.form.* / submitBtn / resetBtn
  const legacyForm = (parsed.form && typeof parsed.form === 'object')
    ? parsed.form as Record<string, unknown>
    : null
  const submitBtn = parsed.submitBtn as { show?: boolean } | undefined
  const resetBtn = parsed.resetBtn as { show?: boolean } | undefined

  const formColsRaw = parsed.formCols
  const formCols = typeof formColsRaw === 'number' && formColsRaw > 0
    ? formColsRaw
    : DEFAULT_BPM_FORM_SETTINGS.formCols

  const hideRequired = legacyForm?.hideRequiredAsterisk
  let showRequireMark = DEFAULT_BPM_FORM_SETTINGS.showRequireMark
  if (typeof parsed.showRequireMark === 'boolean')
    showRequireMark = parsed.showRequireMark
  else if (typeof hideRequired === 'boolean')
    showRequireMark = !hideRequired

  let showFeedback = DEFAULT_BPM_FORM_SETTINGS.showFeedback
  if (typeof parsed.showFeedback === 'boolean')
    showFeedback = parsed.showFeedback
  else if (typeof legacyForm?.showMessage === 'boolean')
    showFeedback = legacyForm.showMessage as boolean

  const ownEvents = pickEventExprs(parsed as Record<string, unknown>)
  const legacyEvents = pickLegacyEventExprs(parsed)

  return {
    formCols,
    labelWidth: normalizeLabelWidth(
      parsed.labelWidth ?? legacyForm?.labelWidth,
    ),
    labelPlacement: normalizeLabelPlacement(
      parsed.labelPlacement ?? legacyForm?.labelPosition,
    ),
    size: normalizeFormSize(parsed.size ?? legacyForm?.size),
    labelSuffix: String(
      parsed.labelSuffix ?? legacyForm?.labelSuffix ?? DEFAULT_BPM_FORM_SETTINGS.labelSuffix,
    ),
    showRequireMark,
    showFeedback,
    showSubmitBtn: typeof parsed.showSubmitBtn === 'boolean'
      ? parsed.showSubmitBtn
      : (typeof submitBtn?.show === 'boolean' ? submitBtn.show : DEFAULT_BPM_FORM_SETTINGS.showSubmitBtn),
    showResetBtn: typeof parsed.showResetBtn === 'boolean'
      ? parsed.showResetBtn
      : (typeof resetBtn?.show === 'boolean' ? resetBtn.show : DEFAULT_BPM_FORM_SETTINGS.showResetBtn),
    ...legacyEvents,
    ...ownEvents,
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
  const settings: BpmFormSettings = {
    ...DEFAULT_BPM_FORM_SETTINGS,
    ...options,
    formCols: options.formCols && options.formCols > 0
      ? options.formCols
      : DEFAULT_BPM_FORM_SETTINGS.formCols,
  }
  const exported = toExportFields(fields)
  const conf: BpmFormConf = {
    engine: BPM_FORM_ENGINE,
    version: 1,
    formCols: settings.formCols,
    labelWidth: settings.labelWidth,
    labelPlacement: settings.labelPlacement,
    size: settings.size,
    labelSuffix: settings.labelSuffix,
    showRequireMark: settings.showRequireMark,
    showFeedback: settings.showFeedback,
    showSubmitBtn: settings.showSubmitBtn,
    showResetBtn: settings.showResetBtn,
  }
  for (const key of FORM_EVENT_KEYS) {
    const expr = normalizeEventExpr(settings[key])
    if (expr)
      conf[key] = expr
  }
  return {
    conf: JSON.stringify(conf),
    fields: exported.map(f => JSON.stringify(f)),
  }
}

export type UnpackedBpmForm = BpmFormSettings & {
  fields: BuilderField[]
}

/** 从 UnpackedBpmForm 抽出表单级设置（忽略 fields） */
export function toBpmFormSettings(unpacked: UnpackedBpmForm): BpmFormSettings {
  const { fields: _fields, ...settings } = unpacked
  return { ...DEFAULT_BPM_FORM_SETTINGS, ...settings }
}

/** 后端 FormVO → 设计器字段（兼容遗留 form-create 规则结构） */
export function unpackBpmForm(
  conf: string | Record<string, any> | null | undefined,
  fields: Array<string | Record<string, any>> | null | undefined,
): UnpackedBpmForm {
  const settings = resolveBpmFormSettings(conf)

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
    return { fields: [], ...settings }

  // FormBuilder / UnifiedFieldConfig
  if (rawList.some(item => item.key || item.component)) {
    try {
      return { fields: parseImportedFields(rawList), ...settings }
    }
    catch {
      return {
        fields: rawList.map(item => normalizeImportedField(item as any)),
        ...settings,
      }
    }
  }

  // 遗留 form-create：{ field, title, type, $required, options, props }
  const converted = rawList.map((rule) => {
    const mapped = mapLegacyRule(rule)
    return normalizeImportedField(mapped as any)
  })
  return { fields: converted, ...settings }
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
  const wrap = rule.wrap && typeof rule.wrap === 'object' ? rule.wrap as Record<string, unknown> : null
  const bindItem: Record<string, unknown> = {}
  if (wrap?.labelWidth != null && wrap.labelWidth !== '')
    bindItem.labelWidth = wrap.labelWidth

  // form-create col.span 为 24 栅格；FormBuilder 用相对列数，默认 1，跨半行约等于 span>=12
  let span = 1
  const colSpan = rule.col?.span ?? rule.props?.span
  if (typeof colSpan === 'number' && colSpan >= 12)
    span = 2

  const mapped: Record<string, any> = {
    key: rule.field || rule.key,
    label: rule.title || rule.label || rule.field,
    component,
    options: rule.options || rule.props?.options,
    form: {
      required: Boolean(rule.$required ?? rule.required),
      span,
      notValidate: DISPLAY_ONLY_COMPONENTS.has(component),
      showFeedback: !DISPLAY_ONLY_COMPONENTS.has(component),
      ...(rule.info ? { info: String(rule.info) } : {}),
      ...(Object.keys(bindItem).length ? { bindItem } : {}),
      ...(rule.value !== undefined ? { defaultValue: rule.value } : {}),
    },
    search: false,
    table: false,
    bind,
  }
  if (rule.dictType || rule._dictType)
    mapped._dictType = rule.dictType || rule._dictType
  const kids = rule.children
  if (Array.isArray(kids) && kids.length)
    mapped.children = kids.map((child: any) => mapLegacyRule(child))
  return mapped
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
    tableForm: 'FormTable',
    subForm: 'FormTable',
    group: 'FormTable',
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
    const options = Array.isArray(rule.options)
      ? rule.options
      : Array.isArray(rule.bind?.options)
        ? rule.bind.options
        : Array.isArray(rule.props?.options)
          ? rule.props.options
          : undefined
    // 明细表本身不进权限列表，只收集行内子字段
    if (field && tempTitle && !DISPLAY_ONLY_COMPONENTS.has(String(type || '')) && !isTable) {
      const title = parentTitle ? `${parentTitle}.${tempTitle}` : tempTitle
      fields.push({
        field,
        title,
        type,
        kind: normalizeBpmFieldKind(type),
        required: Boolean(rule.form && rule.form !== false && rule.form.required),
        options,
        dictType: rule.dictType || rule._dictType,
        _dictType: rule._dictType || rule.dictType,
      })
    }
    const nested = rule.children || rule.bind?.fields || rule.props?.fields
    if (nested && Array.isArray(nested))
      nested.forEach((child: any) => parseFormFields(child, fields, isTable ? tempTitle : (tempTitle || parentTitle)))
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
      options: Array.isArray(options)
        ? options
        : Array.isArray(rule.props?.options)
          ? rule.props.options
          : undefined,
      dictType: rule.dictType || rule._dictType,
      _dictType: rule._dictType || rule.dictType,
    })
  }
  const nested = children || rule.props?.fields
  if (nested && Array.isArray(nested))
    nested.forEach(child => parseFormFields(child, fields, tempTitle || parentTitle))
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

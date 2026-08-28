import type { FieldBind, FormFieldConfig, SearchFieldConfig, TableFieldConfig, UnifiedFieldConfig } from '@/components/common/table/fieldSchema'
import { TABLE_COLUMN_HANDLED_KEYS } from '@/components/common/table/fieldSchema'

/** 属性面板「控件 / 校验」区已可视化管理的全局 bind 键 */
export const COMMON_MANAGED_BIND_KEYS = new Set([
  'placeholder',
  'disabled',
  'readonly',
  'multiple',
  'button',
  'type',
  'rows',
  'pattern',
  'patternType',
  'fileType',
  'message',
])

/** 各组件在 ComponentBindExtras 中已管理的 bind 键 */
export const COMPONENT_MANAGED_BIND_KEYS: Record<string, readonly string[]> = {
  NInput: ['maxlength', 'showCount', 'clearable'],
  NInputNumber: ['min', 'max', 'step', 'precision', 'showButton'],
  NSelect: ['filterable', 'clearable', 'tag'],
  NDatePicker: ['type', 'format', 'valueFormat', 'dateValueSuffix'],
  NTimePicker: ['format', 'valueFormat', 'dateValueSuffix'],
  NSlider: ['min', 'max', 'step', 'range'],
  NRate: ['count', 'allowHalf'],
  NSwitch: ['checkedValue', 'uncheckedValue'],
  NDynamicInput: ['preset', 'keyPlaceholder', 'valuePlaceholder'],
  NDynamicTags: ['max'],
  NInputOtp: ['length', 'mask'],
  NAutoComplete: ['clearable'],
  NMention: ['clearable'],
  NTransfer: ['filterable', 'sourceFilterable', 'targetFilterable'],
  NUpload: ['listType', 'multiple', 'max'],
  UploadFile: ['limit', 'fileSize', 'fileType', 'drag'],
  ImageCropper: ['aspectRatio', 'outputSize', 'mimeType', 'quality'],
  Editor: ['height', 'placeholder'],
  IconSelect: ['clearable'],
  UserSelect: ['multiple', 'placeholder'],
  CronInput: ['placeholder'],
  NColorPicker: ['modes', 'showAlpha'],
  SqlSearch: ['maxDepth', 'showSqlPreview', 'showCopySql', 'validationMode', 'paramsKey', 'sqlKey', 'fields'],
  NCascader: ['filterable', 'clearable'],
  NTreeSelect: ['filterable', 'clearable'],
  DeptSelect: ['filterable', 'clearable', 'onlyEnabled'],
}

/** 场景控件覆盖（SceneBindEditor）已管理的 bind 键 */
export const SCENE_BIND_MANAGED_KEYS = new Set([
  'placeholder',
  'disabled',
  'readonly',
  'multiple',
  'filterable',
  'clearable',
])

/** 场景 Tab 表单区已管理的 form 键 */
export const FORM_MANAGED_KEYS = new Set([
  'required',
  'span',
  'colStart',
  'defaultValue',
  'notValidate',
  'showFeedback',
  'hiddenClear',
])

/** 场景 Tab 搜索区已管理的 search 键 */
export const SEARCH_MANAGED_KEYS = new Set([
  'enabled',
  'span',
  'col',
  'defaultValue',
])

/** 场景 Tab / 列透传共用的 table 已管理键 */
export const TABLE_MANAGED_KEYS = TABLE_COLUMN_HANDLED_KEYS

export type ExtraJsonScope = 'common' | 'form' | 'search' | 'table'

export interface ExtraJsonPreset {
  label: string
  patch: Record<string, unknown>
}

export const EXTRA_JSON_PRESETS: Record<ExtraJsonScope, ExtraJsonPreset[]> = {
  common: [
    { label: 'size', patch: { size: 'small' } },
    { label: 'autofocus', patch: { autofocus: true } },
    { label: 'status', patch: { status: 'warning' } },
  ],
  form: [
    { label: 'class', patch: { class: 'wide' } },
    { label: 'cols', patch: { cols: 2 } },
    { label: 'bind.size', patch: { bind: { size: 'large' } } },
  ],
  search: [
    { label: 'bind.size', patch: { bind: { size: 'small' } } },
    { label: 'bind.clearable', patch: { bind: { clearable: true } } },
  ],
  table: [
    { label: 'resizable', patch: { resizable: true } },
    { label: 'cellProps', patch: { cellProps: { style: { fontWeight: 'bold' } } } },
  ],
}

export function getManagedBindKeys(component: string): Set<string> {
  const keys = new Set(COMMON_MANAGED_BIND_KEYS)
  for (const key of COMPONENT_MANAGED_BIND_KEYS[component] || [])
    keys.add(key)
  return keys
}

function isEmptyValue(value: unknown) {
  return value == null || value === ''
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pickExtraEntries(
  source: Record<string, unknown> | undefined,
  managedKeys: Set<string>,
): Record<string, unknown> {
  const extra: Record<string, unknown> = {}
  if (!source)
    return extra
  for (const [key, value] of Object.entries(source)) {
    if (!managedKeys.has(key) && !isEmptyValue(value))
      extra[key] = value
  }
  return extra
}

/** 拆出扩展键；已管理键写入 ignored，避免与面板重复 */
export function splitExtraAndIgnored(
  extra: Record<string, unknown>,
  managedKeys: Set<string>,
  options?: { allowBind?: boolean },
): { clean: Record<string, unknown>, ignored: string[] } {
  const clean: Record<string, unknown> = {}
  const ignored: string[] = []
  for (const [key, value] of Object.entries(extra)) {
    if (key === 'bind' && options?.allowBind) {
      if (isPlainObject(value)) {
        const nested = splitExtraAndIgnored(value, SCENE_BIND_MANAGED_KEYS)
        if (Object.keys(nested.clean).length)
          clean.bind = nested.clean
        ignored.push(...nested.ignored.map(k => `bind.${k}`))
      }
      else if (value != null) {
        ignored.push('bind')
      }
      continue
    }
    if (managedKeys.has(key)) {
      ignored.push(key)
      continue
    }
    if (!isEmptyValue(value))
      clean[key] = value
  }
  return { clean, ignored }
}

function mergeExtraEntries<T extends Record<string, unknown>>(
  current: T | undefined,
  managedKeys: Set<string>,
  extra: Record<string, unknown>,
): { next: T, ignored: string[] } {
  const { clean, ignored } = splitExtraAndIgnored(extra, managedKeys)
  const next: Record<string, unknown> = { ...(current || {}) }
  for (const key of Object.keys(next)) {
    if (!managedKeys.has(key))
      delete next[key]
  }
  for (const [key, value] of Object.entries(clean))
    next[key] = value
  return { next: next as T, ignored }
}

function resolveSceneBind(bind: FieldBind | FieldBind[] | undefined): FieldBind | undefined {
  if (!bind)
    return undefined
  return Array.isArray(bind) ? bind[0] : bind
}

function pickExtraSceneBind(bind: FieldBind | FieldBind[] | undefined): Record<string, unknown> {
  return pickExtraEntries(resolveSceneBind(bind) as Record<string, unknown> | undefined, SCENE_BIND_MANAGED_KEYS)
}

function mergeExtraSceneBind(
  bind: FieldBind | FieldBind[] | undefined,
  extra: Record<string, unknown>,
): { next: FieldBind, ignored: string[] } {
  const current = resolveSceneBind(bind) || {}
  return mergeExtraEntries(current as Record<string, unknown>, SCENE_BIND_MANAGED_KEYS, extra)
}

export function pickExtraBind(bind: FieldBind | undefined, component: string): Record<string, unknown> {
  return pickExtraEntries(bind as Record<string, unknown> | undefined, getManagedBindKeys(component))
}

export function mergeExtraBind(
  bind: FieldBind | undefined,
  component: string,
  extra: Record<string, unknown>,
): { next: FieldBind, ignored: string[] } {
  return mergeExtraEntries(bind as Record<string, unknown> | undefined, getManagedBindKeys(component), extra)
}

export function pickExtraSceneConfig(
  config: FormFieldConfig | SearchFieldConfig | TableFieldConfig | undefined,
  managedKeys: Set<string>,
): Record<string, unknown> {
  if (!config)
    return {}
  const extra = pickExtraEntries(config as Record<string, unknown>, managedKeys)
  if ('bind' in config) {
    const bindExtra = pickExtraSceneBind((config as FormFieldConfig).bind)
    if (Object.keys(bindExtra).length)
      extra.bind = bindExtra
  }
  return extra
}

export function mergeExtraSceneConfig<T extends FormFieldConfig | SearchFieldConfig | TableFieldConfig>(
  config: T | undefined,
  managedKeys: Set<string>,
  extra: Record<string, unknown>,
): { next: T, ignored: string[] } {
  const current = (config || {}) as T & Record<string, unknown>
  const { clean, ignored } = splitExtraAndIgnored(extra, managedKeys, { allowBind: true })
  const next = { ...current } as T & Record<string, unknown>

  for (const key of Object.keys(next)) {
    if (!managedKeys.has(key) && key !== 'bind')
      delete next[key]
  }

  for (const [key, value] of Object.entries(clean)) {
    if (key === 'bind')
      continue
    next[key] = value
  }

  if ('bind' in clean) {
    const bindExtra = clean.bind
    if (isPlainObject(bindExtra)) {
      const merged = mergeExtraSceneBind((current as FormFieldConfig).bind, bindExtra)
      ignored.push(...merged.ignored.map(k => `bind.${k}`))
      if (Object.keys(merged.next).length)
        (next as FormFieldConfig).bind = merged.next
      else
        delete (next as FormFieldConfig).bind
    }
    else {
      delete (next as FormFieldConfig).bind
    }
  }
  else if ((current as FormFieldConfig).bind) {
    const merged = mergeExtraSceneBind((current as FormFieldConfig).bind, {})
    if (Object.keys(merged.next).length)
      (next as FormFieldConfig).bind = merged.next
    else
      delete (next as FormFieldConfig).bind
  }

  return { next: next as T, ignored }
}

export function formatExtraJson(extra: Record<string, unknown>): string {
  if (!Object.keys(extra).length)
    return ''
  try {
    return JSON.stringify(extra, null, 2)
  }
  catch {
    return ''
  }
}

export function parseExtraJsonObject(text: string, label: string): {
  value: Record<string, unknown> | null
  error: string
} {
  if (!text.trim())
    return { value: {}, error: '' }
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      return { value: null, error: `${label}必须是 JSON 对象` }
    return { value: parsed as Record<string, unknown>, error: '' }
  }
  catch {
    return { value: null, error: 'JSON 格式不正确' }
  }
}

function resolveFieldBind(field: UnifiedFieldConfig | BuilderFieldLike): FieldBind | undefined {
  const bind = field.bind
  if (!bind)
    return undefined
  return Array.isArray(bind) ? bind[0] : bind
}

interface BuilderFieldLike {
  component?: UnifiedFieldConfig['component']
  bind?: FieldBind | FieldBind[]
  form?: false | FormFieldConfig
  search?: false | SearchFieldConfig
  table?: false | TableFieldConfig
}

export function pickExtraByScope(
  field: BuilderFieldLike,
  scope: ExtraJsonScope,
): Record<string, unknown> {
  const component = String(field.component || 'NInput')
  switch (scope) {
    case 'common':
      return pickExtraBind(resolveFieldBind(field), component)
    case 'form':
      return pickExtraSceneConfig(field.form === false ? undefined : field.form, FORM_MANAGED_KEYS)
    case 'search':
      return pickExtraSceneConfig(field.search === false ? undefined : field.search, SEARCH_MANAGED_KEYS)
    case 'table':
      return pickExtraSceneConfig(field.table === false ? undefined : field.table, TABLE_MANAGED_KEYS)
    default:
      return {}
  }
}

export function hasExtraByScope(field: BuilderFieldLike, scope: ExtraJsonScope): boolean {
  return Object.keys(pickExtraByScope(field, scope)).length > 0
}

/** 表单 / 搜索最终 bind 预览（公共 + 场景覆盖） */
export function previewMergedBind(
  field: BuilderFieldLike,
  scene: 'form' | 'search',
): Record<string, unknown> {
  const base = { ...(resolveFieldBind(field) || {}) }
  const sceneConfig = scene === 'form'
    ? (field.form === false ? undefined : field.form)
    : (field.search === false ? undefined : field.search)
  const sceneBind = resolveSceneBind(sceneConfig?.bind)
  return sceneBind ? { ...base, ...sceneBind } : base
}

export function deepMergePatch(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...target }
  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(next[key]))
      next[key] = deepMergePatch(next[key] as Record<string, unknown>, value)
    else
      next[key] = value
  }
  return next
}

/** 去掉空对象 / 空 bind，保持导出干净 */
export function pruneEmptyConfigDeep<T>(value: T): T {
  if (Array.isArray(value))
    return value.map(item => pruneEmptyConfigDeep(item)) as T
  if (!isPlainObject(value))
    return value

  const next: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    const pruned = pruneEmptyConfigDeep(child)
    if (pruned === false) {
      next[key] = false
      continue
    }
    if (isEmptyValue(pruned))
      continue
    if (isPlainObject(pruned) && !Object.keys(pruned).length)
      continue
    next[key] = pruned
  }
  return next as T
}

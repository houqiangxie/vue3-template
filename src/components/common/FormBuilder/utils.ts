import type { NaiveComponentName, UnifiedFieldConfig } from '@/components/common/table/fieldSchema'
import type { BuilderField } from './types'

export function createUid() {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function resolveFieldKey(field: UnifiedFieldConfig) {
  return typeof field.key === 'string' ? field.key : field.key[0]
}

export function resolveComponentLabel(field: BuilderField) {
  const comp = field.component
  const bind = Array.isArray(field.bind) ? field.bind[0] : field.bind
  if (comp === 'NRadioGroup' && bind?.button)
    return 'NRadioButton'
  return String(comp || 'NInput')
}

export function needsOptions(component?: NaiveComponentName | string) {
  return ['NSelect', 'NRadioGroup', 'NCheckboxGroup', 'NTransfer', 'NAutoComplete', 'NMention'].includes(String(component))
}

export function needsTreeOptions(component?: NaiveComponentName | string) {
  return ['NCascader', 'NTreeSelect'].includes(String(component))
}

export function supportsMultiple(component?: NaiveComponentName | string) {
  return ['NSelect', 'NCascader', 'NTreeSelect', 'UserSelect', 'DeptSelect', 'NUpload'].includes(String(component))
}

/** 公共属性区「多选」：排除已在 ComponentBindExtras 中单独管理的组件 */
export function supportsCommonMultiple(component?: NaiveComponentName | string) {
  const name = String(component)
  return supportsMultiple(name) && name !== 'UserSelect' && name !== 'NUpload'
}

export function supportsFilterable(component?: NaiveComponentName | string) {
  return ['NSelect', 'NCascader', 'NTreeSelect', 'DeptSelect', 'NTransfer'].includes(String(component))
}

export function supportsClearable(component?: NaiveComponentName | string) {
  return [
    'NInput',
    'NInputNumber',
    'NSelect',
    'NCascader',
    'NTreeSelect',
    'DeptSelect',
    'NAutoComplete',
    'NMention',
    'NDatePicker',
    'NTimePicker',
    'NColorPicker',
    'IconSelect',
  ].includes(String(component))
}

export function extractModelRefs(expr: string): string[] {
  const refs = new Set<string>()
  const re = /model\.([A-Za-z_$][\w$]*)/g
  let match = re.exec(expr)
  while (match) {
    refs.add(match[1])
    match = re.exec(expr)
  }
  return [...refs]
}

export function formatLooseValue(value: unknown): string {
  if (value === undefined)
    return ''
  if (typeof value === 'string')
    return value
  try {
    return JSON.stringify(value)
  }
  catch {
    return String(value)
  }
}

export function parseLooseValue(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed)
    return undefined
  if (trimmed === 'true')
    return true
  if (trimmed === 'false')
    return false
  // 避免 "01" → 1；仅纯整数/小数（无前导零）才数字化
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(trimmed))
    return Number(trimmed)
  try {
    return JSON.parse(trimmed)
  }
  catch {
    return text
  }
}

export function getFieldSpan(field: BuilderField, formCols: number) {
  if (field.form === false)
    return formCols
  return Math.min(Math.max(field.form?.span ?? 1, 1), formCols)
}

export function getFieldColStart(field: BuilderField, formCols: number) {
  if (field.form === false)
    return 1
  const raw = field.form?.colStart
  if (raw == null || raw < 1)
    return 1
  return Math.min(raw, formCols)
}

export function clampFieldGridPlacement(colStart: number, span: number, formCols: number) {
  const nextSpan = Math.min(Math.max(span, 1), formCols)
  let nextColStart = Math.min(Math.max(colStart, 1), formCols)
  if (nextColStart + nextSpan - 1 > formCols)
    nextColStart = Math.max(1, formCols - nextSpan + 1)
  return { colStart: nextColStart, span: nextSpan }
}

export function resolveColStartFromClientX(
  clientX: number,
  gridRect: DOMRect,
  colWidth: number,
  gridGap: number,
  formCols: number,
) {
  const relativeX = clientX - gridRect.left
  return Math.min(
    formCols,
    Math.max(1, Math.floor(relativeX / (colWidth + gridGap)) + 1),
  )
}

export function fieldWrapGridStyle(field: BuilderField, formCols: number) {
  const span = getFieldSpan(field, formCols)
  if (field.form !== false && field.form?.colStart != null && formCols > 1) {
    const colStart = getFieldColStart(field, formCols)
    const effectiveSpan = Math.min(span, formCols - colStart + 1)
    return { gridColumn: `${colStart} / span ${effectiveSpan}` }
  }
  return { gridColumn: `span ${span}` }
}

export function fieldRuntimeSignature(field: BuilderField): string {
  return [
    field.component,
    field._visibleExpr ?? '',
    field._hiddenExpr ?? '',
    JSON.stringify(field._visibilityRule),
    field._dictType ?? '',
    field._renderExpr ?? '',
    field._onChangeExpr ?? '',
    JSON.stringify(field.bind),
    JSON.stringify(field.options),
    JSON.stringify(field.form),
    JSON.stringify(field.search),
    JSON.stringify(field.table),
  ].join('|')
}

export function isValidFieldKey(key: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(key.trim())
}

export function isFieldKeyTaken(fields: BuilderField[], key: string, excludeUid?: string): boolean {
  const normalized = key.trim()
  if (!normalized)
    return false
  return fields.some(f => f.uid !== excludeUid && resolveFieldKey(f) === normalized)
}

export function findDuplicateKeys(fields: BuilderField[]): string[] {
  const counts = new Map<string, number>()
  for (const field of fields) {
    const key = resolveFieldKey(field)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key)
}

export function validateFieldKey(fields: BuilderField[], key: string, excludeUid?: string): string {
  const trimmed = key.trim()
  if (!trimmed)
    return '字段名不能为空'
  if (!isValidFieldKey(trimmed))
    return '须以字母、_ 或 $ 开头，仅含字母、数字、_、$'
  if (isFieldKeyTaken(fields, trimmed, excludeUid))
    return `字段名「${trimmed}」已存在`
  return ''
}

export function uniqueFieldKey(baseKey: string, existingFields: BuilderField[]): string {
  let key = baseKey
  let suffix = 1
  while (isFieldKeyTaken(existingFields, key))
    key = `${baseKey}${suffix++}`
  return key
}

export function collectCanvasLinkRefKeys(fields: BuilderField[]): string[] {
  const keys = new Set<string>()
  for (const field of fields) {
    const expr = field._visibleExpr || field._hiddenExpr || ''
    extractModelRefs(expr).forEach(k => keys.add(k))
    if (field._renderExpr)
      extractModelRefs(field._renderExpr).forEach(k => keys.add(k))
    if (field._onChangeExpr)
      extractModelRefs(field._onChangeExpr).forEach(k => keys.add(k))
  }
  return [...keys]
}

/** 字段改名后同步其它字段表达式 / 可视化规则中的 model.xxx 引用 */
export function rewriteModelKeyRefs(fields: BuilderField[], oldKey: string, newKey: string) {
  if (!oldKey || !newKey || oldKey === newKey)
    return
  const re = new RegExp(`\\bmodel\\.${oldKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
  const replaceExpr = (expr?: string) => (expr ? expr.replace(re, `model.${newKey}`) : expr)

  for (const field of fields) {
    if (field._visibleExpr)
      field._visibleExpr = replaceExpr(field._visibleExpr)
    if (field._hiddenExpr)
      field._hiddenExpr = replaceExpr(field._hiddenExpr)
    if (field._renderExpr)
      field._renderExpr = replaceExpr(field._renderExpr)
    if (field._onChangeExpr)
      field._onChangeExpr = replaceExpr(field._onChangeExpr)
    const conditions = field._visibilityRule?.conditions
    if (conditions) {
      for (const condition of conditions) {
        if (condition.fieldKey === oldKey)
          condition.fieldKey = newKey
      }
    }
  }
}

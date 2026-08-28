import type { FieldOption, FormFieldConfig, SearchFieldConfig, TableFieldConfig, UnifiedFieldConfig } from '@/components/common/table/fieldSchema'
import type { BuilderField } from './types'
import {
  FORM_MANAGED_KEYS,
  SEARCH_MANAGED_KEYS,
  TABLE_MANAGED_KEYS,
  pickExtraSceneConfig,
  pruneEmptyConfigDeep,
} from './bindManagedKeys'
import { createEmptyRule } from './visibilityBuilder'
import { createUid, resolveFieldKey, uniqueFieldKey } from './utils'

function extractExprFromForm(form: FormFieldConfig | false | undefined) {
  if (form == null || form === false)
    return { visibleExpr: '', hiddenExpr: '', renderExpr: '', onChangeExpr: '' }
  const formRecord = form as FormFieldConfig & {
    visibleExpr?: string
    hiddenExpr?: string
    renderExpr?: string
    onChangeExpr?: string
  }
  return {
    visibleExpr: formRecord.visibleExpr || '',
    hiddenExpr: formRecord.hiddenExpr || '',
    renderExpr: formRecord.renderExpr || '',
    onChangeExpr: formRecord.onChangeExpr || '',
  }
}

/** JSON 往返后恢复 table.tagType 等不可序列化字段 */
export function rehydrateBuilderField(field: BuilderField): BuilderField {
  if (field.table != null && field.table !== false) {
    const table = field.table as TableFieldConfig & { tagTypeValue?: string, exportTextValue?: string }
    if (table.tagTypeValue && typeof table.tagType !== 'function') {
      const type = table.tagTypeValue as 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'
      table.tagType = () => type
    }
  }
  return field
}

/** 深拷贝设计器字段，保留 uid / _*；用于历史与草稿 */
export function cloneBuilderFields(fields: BuilderField[]): BuilderField[] {
  return (JSON.parse(JSON.stringify(fields)) as BuilderField[]).map(rehydrateBuilderField)
}

export function normalizeImportedField(raw: UnifiedFieldConfig): BuilderField {
  const field = JSON.parse(JSON.stringify(raw)) as BuilderField & {
    dictType?: string
    visibilityRule?: BuilderField['_visibilityRule']
    visibleExpr?: string
    hiddenExpr?: string
    renderExpr?: string
    onChangeExpr?: string
  }
  field.uid = createUid()

  if (field.dictType) {
    field._dictType = field.dictType
    delete field.dictType
  }

  if (field.visibilityRule) {
    field._visibilityRule = field.visibilityRule
    delete field.visibilityRule
  }

  // form: false 时表达式可能挂在顶层（见 toExportFields）
  if (field.visibleExpr) {
    field._visibleExpr = field.visibleExpr
    delete field.visibleExpr
  }
  if (field.hiddenExpr) {
    field._hiddenExpr = field.hiddenExpr
    delete field.hiddenExpr
  }
  if (field.renderExpr) {
    field._renderExpr = field.renderExpr
    delete field.renderExpr
  }
  if (field.onChangeExpr) {
    field._onChangeExpr = field.onChangeExpr
    delete field.onChangeExpr
  }

  const form = field.form
  if (form != null && form !== false) {
    const { visibleExpr, hiddenExpr, renderExpr, onChangeExpr } = extractExprFromForm(form)
    if (visibleExpr)
      field._visibleExpr = visibleExpr
    if (hiddenExpr)
      field._hiddenExpr = hiddenExpr
    if (renderExpr)
      field._renderExpr = renderExpr
    if (onChangeExpr)
      field._onChangeExpr = onChangeExpr
    delete (form as FormFieldConfig & { visibleExpr?: string }).visibleExpr
    delete (form as FormFieldConfig & { hiddenExpr?: string }).hiddenExpr
    delete (form as FormFieldConfig & { renderExpr?: string }).renderExpr
    delete (form as FormFieldConfig & { onChangeExpr?: string }).onChangeExpr
  }

  rehydrateBuilderField(field)

  if (field._visibleExpr && !field._visibilityRule)
    field._visibilityRule = createEmptyRule()

  return field
}

export function parseImportedFields(data: unknown): BuilderField[] {
  let list: UnifiedFieldConfig[] = []
  if (Array.isArray(data))
    list = data as UnifiedFieldConfig[]
  else if (data && typeof data === 'object')
    list = [data as UnifiedFieldConfig]
  else
    throw new Error('JSON 须为字段数组或单个字段对象')

  if (!list.length)
    throw new Error('未解析到任何字段')

  return list.map(item => normalizeImportedField(item))
}

export function extractImportPayload(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed)
    throw new Error('内容不能为空')

  try {
    return JSON.parse(trimmed)
  }
  catch {
    // continue
  }

  const defineFieldsMatch = trimmed.match(/defineFields\s*\(\s*(\[[\s\S]*\])\s*\)/)
  if (defineFieldsMatch) {
    try {
      // eslint-disable-next-line no-new-func
      return new Function(`return ${defineFieldsMatch[1]}`)()
    }
    catch {
      try {
        return JSON.parse(defineFieldsMatch[1])
      }
      catch {
        // continue
      }
    }
  }

  const assignMatch = trimmed.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/)
  if (assignMatch) {
    try {
      // eslint-disable-next-line no-new-func
      return new Function(`return ${assignMatch[1]}`)()
    }
    catch {
      try {
        return JSON.parse(assignMatch[1])
      }
      catch {
        // continue
      }
    }
  }

  const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      // eslint-disable-next-line no-new-func
      return new Function(`return ${arrayMatch[0]}`)()
    }
    catch {
      try {
        return JSON.parse(arrayMatch[0])
      }
      catch {
        // continue
      }
    }
  }

  throw new Error('无法解析 JSON，请检查格式或使用 visibleExpr / hiddenExpr 字符串')
}

export function toExportFields(fields: BuilderField[]): UnifiedFieldConfig[] {
  return fields.map((field) => {
    const {
      uid: _uid,
      _visibleExpr,
      _hiddenExpr,
      _visibilityRule,
      _dictType,
      _renderExpr,
      _onChangeExpr,
      _formBackup: _formBackup,
      _searchBackup: _searchBackup,
      _tableBackup: _tableBackup,
      ...rest
    } = field
    const exported = JSON.parse(JSON.stringify(rest)) as UnifiedFieldConfig & {
      dictType?: string
      visibilityRule?: BuilderField['_visibilityRule']
    }
    if (_dictType)
      exported.dictType = _dictType
    if (_visibilityRule?.conditions?.length)
      exported.visibilityRule = _visibilityRule
    // form: false 时保留禁用态；表达式改挂顶层，避免误启用表单场景，同时保证往返不丢
    if (_visibleExpr || _hiddenExpr || _renderExpr || _onChangeExpr) {
      if (exported.form === false) {
        if (_visibleExpr)
          exported.visibleExpr = _visibleExpr
        if (_hiddenExpr)
          exported.hiddenExpr = _hiddenExpr
        if (_renderExpr)
          exported.renderExpr = _renderExpr
        if (_onChangeExpr)
          exported.onChangeExpr = _onChangeExpr
      }
      else {
        const form = { ...(exported.form || {}) }
        if (_visibleExpr)
          (form as FormFieldConfig & { visibleExpr?: string }).visibleExpr = _visibleExpr
        if (_hiddenExpr)
          (form as FormFieldConfig & { hiddenExpr?: string }).hiddenExpr = _hiddenExpr
        if (_renderExpr)
          (form as FormFieldConfig & { renderExpr?: string }).renderExpr = _renderExpr
        if (_onChangeExpr)
          (form as FormFieldConfig & { onChangeExpr?: string }).onChangeExpr = _onChangeExpr
        exported.form = form
      }
    }
    if (exported.table != null && exported.table !== false) {
      const table = exported.table as TableFieldConfig & { tagTypeValue?: string, exportTextValue?: string }
      if (field.table != null && field.table !== false) {
        const srcTable = field.table as TableFieldConfig & { tagTypeValue?: string, exportTextValue?: string }
        // 仅导出已显式保存的 tagTypeValue，避免调用任意 tagType() 抛错或得到错误值
        if (srcTable.tagTypeValue)
          table.tagTypeValue = srcTable.tagTypeValue
        if (srcTable.exportTextValue)
          table.exportTextValue = srcTable.exportTextValue
      }
    }
    return pruneEmptyConfigDeep(exported)
  })
}

function serializeValue(value: unknown): string {
  if (typeof value === 'string')
    return `'${value.replace(/'/g, '\\\'')}'`
  return JSON.stringify(value)
}

function appendSceneExtraParts(
  parts: string[],
  config: FormFieldConfig | SearchFieldConfig | TableFieldConfig | undefined,
  managedKeys: Set<string>,
) {
  const extra = pickExtraSceneConfig(config, managedKeys)
  const bindExtra = extra.bind
  if (bindExtra && typeof bindExtra === 'object' && !Array.isArray(bindExtra)) {
    const bindParts = Object.entries(bindExtra)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}: ${serializeValue(v)}`)
    if (bindParts.length)
      parts.push(`bind: { ${bindParts.join(', ')} }`)
  }
  delete extra.bind
  for (const [key, value] of Object.entries(extra)) {
    if (value != null && value !== '')
      parts.push(`${key}: ${serializeValue(value)}`)
  }
}

export function serializeField(field: BuilderField, indent = 2): string {
  const pad = ' '.repeat(indent)
  const lines: string[] = [`${pad}{`]
  lines.push(`${pad}  key: '${resolveFieldKey(field)}',`)
  if (field.label)
    lines.push(`${pad}  label: '${field.label}',`)
  lines.push(`${pad}  component: '${field.component}',`)
  if (field.options?.length)
    lines.push(`${pad}  options: ${JSON.stringify(field.options)},`)
  if (field._dictType)
    lines.push(`${pad}  dictType: '${field._dictType}',`)
  if (field.form != null && field.form !== false) {
    const formParts: string[] = []
    if (field.form.required)
      formParts.push('required: true')
    if (field.form.span && field.form.span !== 1)
      formParts.push(`span: ${field.form.span}`)
    if (field.form.colStart != null && field.form.colStart !== 1)
      formParts.push(`colStart: ${field.form.colStart}`)
    if (field.form.defaultValue != null)
      formParts.push(`defaultValue: ${serializeValue(field.form.defaultValue)}`)
    if (field.form.notValidate)
      formParts.push('notValidate: true')
    if (field.form.showFeedback === false)
      formParts.push('showFeedback: false')
    if (field.form.hiddenClear)
      formParts.push('hiddenClear: true')
    if (field._visibleExpr)
      formParts.push(`visibleExpr: '${field._visibleExpr.replace(/'/g, '\\\'')}'`)
    else if (field._hiddenExpr)
      formParts.push(`hiddenExpr: '${field._hiddenExpr.replace(/'/g, '\\\'')}'`)
    if (field._renderExpr)
      formParts.push(`renderExpr: '${field._renderExpr.replace(/'/g, '\\\'')}'`)
    if (field._onChangeExpr)
      formParts.push(`onChangeExpr: '${field._onChangeExpr.replace(/'/g, '\\\'')}'`)
    appendSceneExtraParts(formParts, field.form, FORM_MANAGED_KEYS)
    if (formParts.length)
      lines.push(`${pad}  form: { ${formParts.join(', ')} },`)
  }
  else if (field.form === false) {
    lines.push(`${pad}  form: false,`)
    if (field._visibleExpr)
      lines.push(`${pad}  visibleExpr: '${field._visibleExpr.replace(/'/g, '\\\'')}',`)
    else if (field._hiddenExpr)
      lines.push(`${pad}  hiddenExpr: '${field._hiddenExpr.replace(/'/g, '\\\'')}',`)
    if (field._renderExpr)
      lines.push(`${pad}  renderExpr: '${field._renderExpr.replace(/'/g, '\\\'')}',`)
    if (field._onChangeExpr)
      lines.push(`${pad}  onChangeExpr: '${field._onChangeExpr.replace(/'/g, '\\\'')}',`)
  }
  if (field.bind && Object.keys(field.bind).length) {
    const bindParts = Object.entries(field.bind)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}: ${serializeValue(v)}`)
    if (bindParts.length)
      lines.push(`${pad}  bind: { ${bindParts.join(', ')} },`)
  }
  if (field.search === false) {
    lines.push(`${pad}  search: false,`)
  }
  else if (field.search) {
    const searchParts: string[] = []
    if (field.search.enabled === false)
      searchParts.push('enabled: false')
    if (field.search.span != null)
      searchParts.push(`span: ${field.search.span}`)
    if (field.search.defaultValue != null)
      searchParts.push(`defaultValue: ${serializeValue(field.search.defaultValue)}`)
    appendSceneExtraParts(searchParts, field.search, SEARCH_MANAGED_KEYS)
    if (searchParts.length)
      lines.push(`${pad}  search: { ${searchParts.join(', ')} },`)
  }
  if (field.table === false) {
    lines.push(`${pad}  table: false,`)
  }
  else if (field.table) {
    const tableParts: string[] = []
    const tableMeta = field.table as TableFieldConfig & { tagTypeValue?: string, exportTextValue?: string }
    if (field.table.width != null)
      tableParts.push(`width: ${field.table.width}`)
    if (field.table.minWidth != null)
      tableParts.push(`minWidth: ${field.table.minWidth}`)
    if (field.table.maxWidth != null)
      tableParts.push(`maxWidth: ${field.table.maxWidth}`)
    if (field.table.fixed)
      tableParts.push(`fixed: '${field.table.fixed}'`)
    if (field.table.align)
      tableParts.push(`align: '${field.table.align}'`)
    if (field.table.sortable)
      tableParts.push('sortable: true')
    if (field.table.ellipsis)
      tableParts.push(`ellipsis: ${serializeValue(field.table.ellipsis)}`)
    if (field.table.format)
      tableParts.push(`format: '${field.table.format}'`)
    if (tableMeta.exportTextValue)
      tableParts.push(`exportTextValue: '${tableMeta.exportTextValue.replace(/'/g, '\\\'')}'`)
    if (tableMeta.allowExport === false)
      tableParts.push('allowExport: false')
    if (tableMeta.tagTypeValue)
      tableParts.push(`tagTypeValue: '${tableMeta.tagTypeValue}'`)
    appendSceneExtraParts(tableParts, field.table, TABLE_MANAGED_KEYS)
    if (tableParts.length)
      lines.push(`${pad}  table: { ${tableParts.join(', ')} },`)
  }
  lines.push(`${pad}}`)
  return lines.join('\n')
}

export function serializeDefineFields(fields: BuilderField[], varName = 'fields'): string {
  const body = fields.map(f => serializeField(f)).join(',\n')
  return `const ${varName} = defineFields([\n${body}\n])\n`
}

export function createFieldFromPalette(
  item: { label: string, component: import('@/components/common/table/fieldSchema').NaiveComponentName, defaults?: Partial<BuilderField> },
  existingFields: BuilderField[],
): BuilderField {
  const baseKey = item.component.replace(/^N/, '').replace(/Group$/, '').toLowerCase()
  const count = existingFields.filter(f => String(f.component).toLowerCase().startsWith(baseKey)).length + 1
  const defaults = item.defaults ? structuredClone(item.defaults) : undefined
  return {
    uid: createUid(),
    key: uniqueFieldKey(`${baseKey}${count}`, existingFields),
    label: item.label,
    component: item.component,
    form: { required: false, span: 1 },
    search: false,
    table: false,
    bind: {},
    ...defaults,
    options: defaults?.options ? structuredClone(defaults.options as FieldOption[]) : undefined,
  }
}

export function duplicateField(field: BuilderField, existingFields: BuilderField[]): BuilderField {
  // 直接克隆设计器字段，避免 toExportFields 在 form:false 等边界下丢 _* 状态
  const copy = cloneBuilderFields([field])[0]
  copy.uid = createUid()
  const baseKey = resolveFieldKey(field)
  copy.key = uniqueFieldKey(`${baseKey}_copy`, existingFields)
  copy.label = `${field.label || baseKey} (副本)`
  return copy
}

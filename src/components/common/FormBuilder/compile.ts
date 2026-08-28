import type { FormFieldConfig, TableFieldConfig, UnifiedFieldConfig } from '@/components/common/table/fieldSchema'
import type { BuilderField } from './types'
import { fieldRuntimeSignature } from './utils'

const runtimeCache = new Map<string, { sig: string, config: UnifiedFieldConfig }>()

export function compileExpr(
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
    // 无效表达式默认隐藏（visible）/ 不隐藏（hidden），避免误展示
    return () => fallback
  }
}

export function compileFieldForRuntime(field: BuilderField): UnifiedFieldConfig {
  const {
    uid: _uid,
    _visibleExpr,
    _hiddenExpr,
    _visibilityRule: _vr,
    _dictType: _dt,
    _renderExpr,
    _onChangeExpr,
    _formBackup: _fb,
    _searchBackup: _sb,
    _tableBackup: _tb,
    ...rest
  } = field
  const compiled = JSON.parse(JSON.stringify(rest)) as UnifiedFieldConfig

  if (compiled.bind && typeof compiled.bind === 'object' && !Array.isArray(compiled.bind)) {
    const bind = { ...compiled.bind } as Record<string, unknown>
    if (typeof bind.pattern === 'string' && bind.pattern) {
      try {
        bind.pattern = new RegExp(String(bind.pattern))
      }
      catch {
        delete bind.pattern
      }
    }
    compiled.bind = bind
  }

  if (compiled.form !== false) {
    const form: FormFieldConfig = { ...(compiled.form || {}) }
    if (_visibleExpr)
      form.visible = compileExpr(_visibleExpr, false)
    if (_hiddenExpr)
      form.hidden = compileExpr(_hiddenExpr, false)
    if (_renderExpr?.trim()) {
      try {
        // eslint-disable-next-line no-new-func
        form.render = new Function('item', 'model', 'curData', `return (${_renderExpr})`) as FormFieldConfig['render']
      }
      catch {
        // ignore invalid render
      }
    }
    if (_onChangeExpr?.trim()) {
      try {
        // eslint-disable-next-line no-new-func
        const handler = new Function('value', 'model', 'item', _onChangeExpr) as (...args: unknown[]) => void
        form.on = { ...(form.on || {}), change: handler }
      }
      catch {
        // ignore invalid handler
      }
    }
    compiled.form = form
  }
  if (compiled.table != null && compiled.table !== false) {
    const table = { ...compiled.table } as TableFieldConfig & { tagTypeValue?: string, exportTextValue?: string }
    const tagTypeValue = table.tagTypeValue
    if (tagTypeValue) {
      const type = tagTypeValue as 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'
      table.tagType = () => type
    }
    if (table.exportTextValue) {
      const template = table.exportTextValue
      table.exportText = (value: unknown) => template.replace(/\{value\}/g, String(value ?? ''))
      delete table.exportTextValue
    }
    delete table.tagTypeValue
    compiled.table = table
  }
  return compiled
}

export function getRuntimeField(field: BuilderField): UnifiedFieldConfig {
  const sig = fieldRuntimeSignature(field)
  const hit = runtimeCache.get(field.uid)
  if (hit?.sig === sig)
    return hit.config
  const config = compileFieldForRuntime(field)
  runtimeCache.set(field.uid, { sig, config })
  return config
}

export function invalidateRuntimeCache(uid?: string) {
  if (uid)
    runtimeCache.delete(uid)
  else
    runtimeCache.clear()
}

export function validateVisibilityExpr(expr: string): string {
  const trimmed = expr.trim()
  if (!trimmed)
    return ''
  try {
    // eslint-disable-next-line no-new-func
    new Function('model', `return (${trimmed})`)
    return ''
  }
  catch (error) {
    return error instanceof Error ? error.message : '表达式无效'
  }
}

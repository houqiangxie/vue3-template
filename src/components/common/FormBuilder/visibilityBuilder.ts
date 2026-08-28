import type { VisibilityCondition, VisibilityRule } from './types'

export const visibilityOperatorOptions = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'neq' },
  { label: '为真值', value: 'truthy' },
  { label: '为空', value: 'empty' },
  { label: '大于', value: 'gt' },
  { label: '小于', value: 'lt' },
  { label: '包含', value: 'includes' },
] as const

export function createEmptyCondition(): VisibilityCondition {
  return { fieldKey: '', operator: 'eq', value: '' }
}

export function createEmptyRule(): VisibilityRule {
  return { logic: 'and', conditions: [createEmptyCondition()] }
}

/** 将比较值写成表达式字面量（支持数字 / 布尔 / 字符串） */
export function serializeCompareLiteral(value: string | undefined): string {
  const raw = value ?? ''
  const trimmed = raw.trim()
  if (!trimmed)
    return '\'\''
  if (trimmed === 'true' || trimmed === 'false')
    return trimmed
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(trimmed))
    return trimmed
  return `'${raw.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`
}

function conditionToExpr(condition: VisibilityCondition): string {
  if (!condition.fieldKey)
    return ''
  const ref = `model.${condition.fieldKey}`
  switch (condition.operator) {
    case 'eq':
      return `${ref} === ${serializeCompareLiteral(condition.value)}`
    case 'neq':
      return `${ref} !== ${serializeCompareLiteral(condition.value)}`
    case 'truthy':
      return `!!${ref}`
    case 'empty':
      // 不用 ||，避免 tryParse 按 || 拆条件时把「为空」拆坏
      return `(${ref} ?? '') === ''`
    case 'gt':
      return `Number(${ref}) > ${condition.value ?? '0'}`
    case 'lt':
      return `Number(${ref}) < ${condition.value ?? '0'}`
    case 'includes':
      return `String(${ref} ?? '').includes(${serializeCompareLiteral(condition.value)})`
    default:
      return ''
  }
}

export function buildVisibilityExpr(rule: VisibilityRule): string {
  const parts = rule.conditions
    .map(conditionToExpr)
    .filter(Boolean)
  if (!parts.length)
    return ''
  if (parts.length === 1)
    return parts[0]
  const joiner = rule.logic === 'and' ? ' && ' : ' || '
  return `(${parts.join(joiner)})`
}

export function needsConditionValue(operator: VisibilityCondition['operator']) {
  return ['eq', 'neq', 'gt', 'lt', 'includes'].includes(operator)
}

function stripOuterParens(expr: string): string {
  let current = expr.trim()
  while (current.startsWith('(') && current.endsWith(')')) {
    let depth = 0
    let wrapped = true
    for (let i = 0; i < current.length; i++) {
      if (current[i] === '(')
        depth++
      else if (current[i] === ')') {
        depth--
        if (depth === 0 && i < current.length - 1) {
          wrapped = false
          break
        }
      }
    }
    if (!wrapped || depth !== 0)
      break
    current = current.slice(1, -1).trim()
  }
  return current
}

function splitTopLevel(expr: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i]
    if (char === '(')
      depth++
    else if (char === ')')
      depth--
    else if (depth === 0 && expr.startsWith(separator, i)) {
      parts.push(expr.slice(start, i).trim())
      start = i + separator.length
      i += separator.length - 1
    }
  }
  parts.push(expr.slice(start).trim())
  return parts.filter(Boolean)
}

function unescapeQuoted(value: string) {
  return value.replace(/\\'/g, '\'')
}

function literalToConditionValue(literal: string): string {
  const trimmed = literal.trim()
  if ((trimmed.startsWith('\'') && trimmed.endsWith('\'')) || (trimmed.startsWith('"') && trimmed.endsWith('"')))
    return unescapeQuoted(trimmed.slice(1, -1))
  return trimmed
}

function hasTopLevelLogic(expr: string) {
  return splitTopLevel(expr, ' || ').length > 1 || splitTopLevel(expr, ' && ').length > 1
}

function parseSingleCondition(part: string): VisibilityCondition | null {
  const source = stripOuterParens(part)

  let match = source.match(/^model\.([A-Za-z_$][\w$]*)\s*===\s*(.+)$/)
  if (match) {
    // 避免 `a === 1 && b === 2` 被 `.+` 误吞成单条件
    if (hasTopLevelLogic(match[2]))
      return null
    return { fieldKey: match[1], operator: 'eq', value: literalToConditionValue(match[2]) }
  }

  match = source.match(/^model\.([A-Za-z_$][\w$]*)\s*!==\s*(.+)$/)
  if (match) {
    if (hasTopLevelLogic(match[2]))
      return null
    return { fieldKey: match[1], operator: 'neq', value: literalToConditionValue(match[2]) }
  }

  match = source.match(/^!!model\.([A-Za-z_$][\w$]*)$/)
  if (match)
    return { fieldKey: match[1], operator: 'truthy' }

  // 新 empty：把 null/undefined/'' 都视为空，且不含 ||
  match = source.match(/^\(model\.([A-Za-z_$][\w$]*)\s*\?\?\s*''\)\s*===\s*''$/)
  if (match)
    return { fieldKey: match[1], operator: 'empty' }

  // 旧 empty：model.x == null || model.x === ''（可能带外层括号）
  match = source.match(/^\(?\s*model\.([A-Za-z_$][\w$]*)\s*==\s*null\s*\|\|\s*model\.\1\s*===\s*''\s*\)?$/)
  if (match)
    return { fieldKey: match[1], operator: 'empty' }

  match = source.match(/^!model\.([A-Za-z_$][\w$]*)$/)
  if (match)
    return { fieldKey: match[1], operator: 'empty' }

  match = source.match(/^Number\(model\.([A-Za-z_$][\w$]*)\)\s*>\s*(.+)$/)
  if (match) {
    if (hasTopLevelLogic(match[2]))
      return null
    return { fieldKey: match[1], operator: 'gt', value: match[2].trim() }
  }

  match = source.match(/^Number\(model\.([A-Za-z_$][\w$]*)\)\s*<\s*(.+)$/)
  if (match) {
    if (hasTopLevelLogic(match[2]))
      return null
    return { fieldKey: match[1], operator: 'lt', value: match[2].trim() }
  }

  match = source.match(/^String\(model\.([A-Za-z_$][\w$]*)\s*\?\?\s*''\)\.includes\((.+)\)$/)
  if (match) {
    if (hasTopLevelLogic(match[2]))
      return null
    return { fieldKey: match[1], operator: 'includes', value: literalToConditionValue(match[2]) }
  }

  return null
}

/** 将 buildVisibilityExpr 生成的表达式解析回可视化规则；无法识别时返回 null */
export function tryParseVisibilityExpr(expr: string): VisibilityRule | null {
  const trimmed = expr.trim()
  if (!trimmed)
    return createEmptyRule()

  const body = stripOuterParens(trimmed)

  // 先整句匹配（兼容旧 empty 含 ||；eq 已拒绝误吞逻辑连接）
  const single = parseSingleCondition(body)
  if (single)
    return { logic: 'and', conditions: [single] }

  const orParts = splitTopLevel(body, ' || ')
  const logic: VisibilityRule['logic'] = orParts.length > 1 ? 'or' : 'and'
  const parts = orParts.length > 1 ? orParts : splitTopLevel(body, ' && ')
  if (parts.length <= 1)
    return null

  const conditions: VisibilityCondition[] = []
  for (const part of parts) {
    const condition = parseSingleCondition(part)
    if (!condition)
      return null
    conditions.push(condition)
  }

  return conditions.length ? { logic, conditions } : createEmptyRule()
}

export function syncVisibilityRuleFromExpr(
  field: { _visibilityRule?: VisibilityRule },
  expr: string,
) {
  const parsed = tryParseVisibilityExpr(expr)
  if (!parsed)
    return
  // 单条件表达式不含 && / ||，解析会默认成 and；保留已有 logic，避免可视化切换被冲掉
  if (parsed.conditions.length <= 1 && field._visibilityRule?.logic)
    parsed.logic = field._visibilityRule.logic
  field._visibilityRule = parsed
}

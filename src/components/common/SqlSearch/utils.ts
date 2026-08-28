import type {
  SqlCompareOperator,
  SqlFieldType,
  SqlParameterizedResult,
  SqlSearchCompileOptions,
  SqlSearchCondition,
  SqlSearchFieldDef,
  SqlSearchGroup,
  SqlSearchNode,
  SqlSearchParamCondition,
  SqlSearchParamGroup,
  SqlSearchParamNode,
  SqlSearchParams,
  SqlSearchValue,
  SqlValidationMode,
} from './types'
import { operatorLabels } from './labels'

let idSeq = 0

const DEFAULT_COLUMN_PATTERN = /^[a-zA-Z_][\w.]*$/

export function genSqlSearchId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return `sql_${crypto.randomUUID()}`
  idSeq += 1
  return `sql_${Date.now()}_${idSeq}`
}

export function createEmptyCondition(): SqlSearchCondition {
  return {
    type: 'condition',
    id: genSqlSearchId(),
    field: '',
    operator: 'eq',
    value: undefined,
  }
}

export function createEmptyGroup(withCondition = true): SqlSearchGroup {
  return {
    type: 'group',
    id: genSqlSearchId(),
    logic: 'and',
    children: withCondition ? [createEmptyCondition()] : [],
  }
}

export function createDefaultSqlSearchValue(): SqlSearchValue {
  return createEmptyGroup(true)
}

/** 仅 Demo / 表单设计器默认字段 */
export const DEFAULT_SQL_SEARCH_FIELDS: SqlSearchFieldDef[] = [
  { key: 'name', label: '名称', type: 'string' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: '1' },
      { label: '停用', value: '0' },
    ],
  },
  { key: 'age', label: '年龄', type: 'number' },
  { key: 'createTime', label: '创建时间', type: 'datetime' },
  { key: 'enabled', label: '是否启用', type: 'boolean' },
]

export { operatorLabels }

const OPERATORS_BY_TYPE: Record<SqlFieldType, SqlCompareOperator[]> = {
  string: ['eq', 'neq', 'like', 'notLike', 'startsWith', 'endsWith', 'in', 'notIn', 'isNull', 'isNotNull'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn', 'isNull', 'isNotNull'],
  select: ['eq', 'neq', 'in', 'notIn', 'isNull', 'isNotNull'],
  date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
  datetime: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
  boolean: ['eq', 'isNull', 'isNotNull'],
}

export function getOperatorsForFieldType(type: SqlFieldType = 'string'): SqlCompareOperator[] {
  return OPERATORS_BY_TYPE[type] ?? OPERATORS_BY_TYPE.string
}

export function getOperatorsForField(field?: SqlSearchFieldDef): SqlCompareOperator[] {
  if (!field)
    return getOperatorsForFieldType('string')
  if (field.operators?.length)
    return field.operators
  return getOperatorsForFieldType(field.type ?? 'string')
}

export function operatorNeedsValue(operator: SqlCompareOperator): boolean {
  return operator !== 'isNull' && operator !== 'isNotNull'
}

export function operatorNeedsArrayValue(operator: SqlCompareOperator): boolean {
  return operator === 'in' || operator === 'notIn'
}

export function operatorNeedsRangeValue(operator: SqlCompareOperator): boolean {
  return operator === 'between'
}

export function resolveFieldType(
  fieldKey: string,
  fieldMap: Map<string, SqlSearchFieldDef>,
): SqlFieldType {
  return fieldMap.get(fieldKey)?.type ?? 'string'
}

export function resolveFieldColumn(
  fieldKey: string,
  fieldMap: Map<string, SqlSearchFieldDef>,
  pattern: RegExp = DEFAULT_COLUMN_PATTERN,
): string {
  const field = fieldMap.get(fieldKey)
  const raw = field?.column || field?.key || fieldKey
  return sanitizeColumnName(raw, pattern)
}

export function sanitizeColumnName(
  column: string,
  pattern: RegExp = DEFAULT_COLUMN_PATTERN,
): string {
  if (pattern.test(column))
    return column
  return ''
}

export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export function buildFieldMap(fields: SqlSearchFieldDef[]): Map<string, SqlSearchFieldDef> {
  return new Map(fields.map(field => [field.key, field]))
}

export function getVisibleFields(fields: SqlSearchFieldDef[]): SqlSearchFieldDef[] {
  return fields.filter(field => !field.hidden)
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatSqlDateValue(
  value: unknown,
  fieldType: 'date' | 'datetime',
): string | null {
  if (value == null || value === '')
    return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed))
      return fieldType === 'date' ? trimmed.slice(0, 10) : trimmed
    const asNum = Number(trimmed)
    if (trimmed !== '' && Number.isFinite(asNum))
      return formatDateObject(new Date(asNum), fieldType)
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime()))
      return formatDateObject(parsed, fieldType)
    return null
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      return null
    return formatDateObject(new Date(value), fieldType)
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()))
      return null
    return formatDateObject(value, fieldType)
  }

  return null
}

function formatDateObject(date: Date, fieldType: 'date' | 'datetime'): string {
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  if (fieldType === 'date')
    return `${y}-${m}-${d}`
  return `${y}-${m}-${d} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

export function toDatePickerTimestamp(value: unknown): number | null {
  if (value == null || value === '')
    return null
  if (typeof value === 'number' && Number.isFinite(value))
    return value
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value.getTime()
  if (typeof value === 'string') {
    const asNum = Number(value)
    if (value.trim() !== '' && Number.isFinite(asNum) && !/^\d{4}-\d{2}-\d{2}/.test(value))
      return asNum
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

export function normalizeBooleanValue(value: unknown): boolean | null {
  if (value == null || value === '')
    return null
  if (typeof value === 'boolean')
    return value
  if (value === 1 || value === '1' || value === 'true' || value === 'TRUE')
    return true
  if (value === 0 || value === '0' || value === 'false' || value === 'FALSE')
    return false
  return null
}

function isEmptyScalar(value: unknown): boolean {
  return value == null || value === ''
}

/** 完全空白行（无字段、无有效值） */
export function isConditionBlank(condition: SqlSearchCondition): boolean {
  if (condition.field)
    return false
  if (!operatorNeedsValue(condition.operator))
    return true
  if (operatorNeedsRangeValue(condition.operator)) {
    const range = Array.isArray(condition.value) ? condition.value : []
    return isEmptyScalar(range[0]) && isEmptyScalar(range[1])
  }
  if (operatorNeedsArrayValue(condition.operator))
    return !Array.isArray(condition.value) || !condition.value.some(v => !isEmptyScalar(v))
  return isEmptyScalar(condition.value)
}

export function isFieldValid(fieldKey: string, fieldMap: Map<string, SqlSearchFieldDef>): boolean {
  return !!fieldKey && fieldMap.has(fieldKey)
}

export function isConditionComplete(
  condition: SqlSearchCondition,
  fieldMap?: Map<string, SqlSearchFieldDef>,
): boolean {
  if (isConditionBlank(condition))
    return false
  if (!condition.field)
    return false
  if (fieldMap && !isFieldValid(condition.field, fieldMap))
    return false
  if (!operatorNeedsValue(condition.operator))
    return true
  if (operatorNeedsRangeValue(condition.operator)) {
    const range = Array.isArray(condition.value) ? condition.value : []
    return !isEmptyScalar(range[0]) && !isEmptyScalar(range[1])
  }
  if (operatorNeedsArrayValue(condition.operator))
    return Array.isArray(condition.value) && condition.value.some(v => !isEmptyScalar(v))
  return !isEmptyScalar(condition.value)
}

function isNodeComplete(
  node: SqlSearchNode,
  mode: SqlValidationMode,
  fieldMap?: Map<string, SqlSearchFieldDef>,
): boolean {
  if (node.type === 'condition') {
    if (mode === 'lenient' && isConditionBlank(node))
      return true
    return isConditionComplete(node, fieldMap)
  }
  if (!node.children.length)
    return mode === 'lenient'
  return node.children.every(child => isNodeComplete(child, mode, fieldMap))
}

function hasActiveCondition(node: SqlSearchNode, fieldMap?: Map<string, SqlSearchFieldDef>): boolean {
  if (node.type === 'condition')
    return isConditionComplete(node, fieldMap)
  return node.children.some(child => hasActiveCondition(child, fieldMap))
}

export function isSqlSearchComplete(
  value: SqlSearchValue | undefined | null,
  mode: SqlValidationMode = 'strict',
  fields?: SqlSearchFieldDef[],
): boolean {
  if (!value)
    return false
  const fieldMap = fields?.length ? buildFieldMap(fields) : undefined
  if (!isNodeComplete(value, mode, fieldMap))
    return false
  if (mode === 'lenient')
    return hasActiveCondition(value, fieldMap) || value.children.every(c => c.type === 'condition' && isConditionBlank(c))
  return true
}

function repairCondition(
  condition: SqlSearchCondition,
  fieldMap: Map<string, SqlSearchFieldDef>,
): SqlSearchCondition {
  const next: SqlSearchCondition = {
    ...condition,
    id: condition.id || genSqlSearchId(),
    type: 'condition',
  }
  if (!next.field)
    return next

  const field = fieldMap.get(next.field)
  if (!field) {
    next.field = ''
    next.value = undefined
    return next
  }

  const ops = getOperatorsForField(field)
  if (!ops.includes(next.operator))
    next.operator = field.defaultOperator && ops.includes(field.defaultOperator)
      ? field.defaultOperator
      : ops[0]!

  if (!operatorNeedsValue(next.operator))
    next.value = undefined

  return next
}

function repairGroup(
  group: SqlSearchGroup,
  fieldMap: Map<string, SqlSearchFieldDef>,
): SqlSearchGroup {
  const children = (group.children ?? []).map((child) => {
    if (child.type === 'group')
      return repairGroup({ ...child, id: child.id || genSqlSearchId(), type: 'group' }, fieldMap)
    return repairCondition({ ...child, id: child.id || genSqlSearchId(), type: 'condition' }, fieldMap)
  })
  return {
    ...group,
    id: group.id || genSqlSearchId(),
    type: 'group',
    logic: group.logic === 'or' ? 'or' : 'and',
    children: children.length ? children : [createEmptyCondition()],
  }
}

/** 修复 id / operator / 失效字段，用于回显与导入 JSON */
export function repairSqlSearchValue(
  value: unknown,
  fields: SqlSearchFieldDef[],
): SqlSearchValue {
  const fieldMap = buildFieldMap(fields)
  if (value && typeof value === 'object' && (value as SqlSearchGroup).type === 'group')
    return repairGroup(value as SqlSearchGroup, fieldMap)
  return createDefaultSqlSearchValue()
}

export function normalizeSqlSearchValue(
  value: unknown,
  fields?: SqlSearchFieldDef[],
): SqlSearchValue {
  if (fields?.length)
    return repairSqlSearchValue(value, fields)
  if (value && typeof value === 'object' && (value as SqlSearchGroup).type === 'group')
    return value as SqlSearchValue
  return createDefaultSqlSearchValue()
}

export function cloneCondition(condition: SqlSearchCondition): SqlSearchCondition {
  return {
    ...condition,
    id: genSqlSearchId(),
    value: Array.isArray(condition.value) ? [...condition.value] : condition.value,
  }
}

export function cloneGroup(group: SqlSearchGroup): SqlSearchGroup {
  return {
    ...group,
    id: genSqlSearchId(),
    children: group.children.map((child) => {
      if (child.type === 'group')
        return cloneGroup(child)
      return cloneCondition(child)
    }),
  }
}

function walkTree(
  node: SqlSearchNode,
  visitor: (node: SqlSearchNode, parent: SqlSearchGroup | null) => SqlSearchNode | null,
  parent: SqlSearchGroup | null = null,
): SqlSearchNode | null {
  const result = visitor(node, parent)
  if (!result)
    return null
  if (result.type === 'group') {
    const children = result.children
      .map(child => walkTree(child, visitor, result))
      .filter((child): child is SqlSearchNode => child != null)
    return { ...result, children }
  }
  return result
}

export function updateNodeInTree(
  root: SqlSearchValue,
  targetId: string,
  updater: (node: SqlSearchNode) => SqlSearchNode | null,
): SqlSearchValue {
  const next = walkTree(root, (node) => {
    if (node.id !== targetId)
      return node
    return updater(node)
  })
  return (next?.type === 'group' ? next : root)
}

export function patchNodeInTree(
  root: SqlSearchValue,
  targetId: string,
  patch: Partial<SqlSearchCondition> | Partial<SqlSearchGroup>,
): SqlSearchValue {
  return updateNodeInTree(root, targetId, node => ({ ...node, ...patch } as SqlSearchNode))
}

export function replaceNodeInTree(
  root: SqlSearchValue,
  targetId: string,
  replacement: SqlSearchNode,
): SqlSearchValue {
  return updateNodeInTree(root, targetId, () => replacement)
}

export function removeNodeFromTree(root: SqlSearchValue, targetId: string): SqlSearchValue {
  if (root.id === targetId)
    return createDefaultSqlSearchValue()

  const next = walkTree(root, (node, parent) => {
    if (node.id !== targetId)
      return node
    return null
  })

  const result = (next?.type === 'group' ? next : root)
  if (!result.children.length)
    result.children = [createEmptyCondition()]
  return result
}

export function appendChildToGroup(
  root: SqlSearchValue,
  groupId: string,
  child: SqlSearchNode,
): SqlSearchValue {
  return updateNodeInTree(root, groupId, (node) => {
    if (node.type !== 'group')
      return node
    return { ...node, children: [...node.children, child] }
  }) as SqlSearchValue
}

export function reorderGroupChildren(
  root: SqlSearchValue,
  groupId: string,
  children: SqlSearchNode[],
): SqlSearchValue {
  return patchNodeInTree(root, groupId, { children: children.slice() } as Partial<SqlSearchGroup>)
}

export function updateGroupChildAt(
  root: SqlSearchValue,
  groupId: string,
  index: number,
  child: SqlSearchNode,
): SqlSearchValue {
  return updateNodeInTree(root, groupId, (node) => {
    if (node.type !== 'group')
      return node
    const children = node.children.slice()
    children[index] = child
    return { ...node, children }
  }) as SqlSearchValue
}

interface CompileCtx {
  fieldMap: Map<string, SqlSearchFieldDef>
  columnPattern: RegExp
  escapeLike: boolean
  params: unknown[]
  parameterized: boolean
}

function pushParam(ctx: CompileCtx, value: unknown): string {
  if (!ctx.parameterized)
    return '?'
  ctx.params.push(value)
  return '?'
}

function escapeSqlLiteral(value: unknown, fieldType: SqlFieldType): string {
  if (isEmptyScalar(value))
    return 'NULL'

  if (fieldType === 'number')
    return Number.isFinite(Number(value)) ? String(Number(value)) : 'NULL'

  if (fieldType === 'boolean') {
    const bool = normalizeBooleanValue(value)
    if (bool == null)
      return 'NULL'
    return bool ? '1' : '0'
  }

  if (fieldType === 'date' || fieldType === 'datetime') {
    const formatted = formatSqlDateValue(value, fieldType)
    if (!formatted)
      return 'NULL'
    return `'${formatted.replace(/'/g, "''")}'`
  }

  return `'${String(value).replace(/'/g, "''")}'`
}

function formatLiteral(value: unknown, fieldType: SqlFieldType, ctx: CompileCtx): string {
  if (ctx.parameterized && !isEmptyScalar(value)) {
    if (fieldType === 'boolean') {
      const bool = normalizeBooleanValue(value)
      if (bool == null)
        return 'NULL'
      return pushParam(ctx, bool ? 1 : 0)
    }
    if (fieldType === 'date' || fieldType === 'datetime') {
      const formatted = formatSqlDateValue(value, fieldType)
      if (!formatted)
        return 'NULL'
      return pushParam(ctx, formatted)
    }
    if (fieldType === 'number') {
      const num = Number(value)
      if (!Number.isFinite(num))
        return 'NULL'
      return pushParam(ctx, num)
    }
    return pushParam(ctx, value)
  }
  return escapeSqlLiteral(value, fieldType)
}

function formatLikeValue(raw: unknown, mode: 'contains' | 'starts' | 'ends', escapeLike: boolean): string {
  const text = String(raw ?? '')
  const escaped = escapeLike ? escapeLikePattern(text) : text
  if (mode === 'starts')
    return `${escaped}%`
  if (mode === 'ends')
    return `%${escaped}`
  return `%${escaped}%`
}

function compileConditionSql(
  condition: SqlSearchCondition,
  ctx: CompileCtx,
): string {
  if (!condition.field || isConditionBlank(condition))
    return ''

  const fieldType = resolveFieldType(condition.field, ctx.fieldMap)
  const column = resolveFieldColumn(condition.field, ctx.fieldMap, ctx.columnPattern)
  if (!column)
    return ''

  const operator = condition.operator
  let sql = ''

  switch (operator) {
    case 'eq':
      sql = `${column} = ${formatLiteral(condition.value, fieldType, ctx)}`
      break
    case 'neq':
      sql = `${column} <> ${formatLiteral(condition.value, fieldType, ctx)}`
      break
    case 'gt':
      sql = `${column} > ${formatLiteral(condition.value, fieldType, ctx)}`
      break
    case 'gte':
      sql = `${column} >= ${formatLiteral(condition.value, fieldType, ctx)}`
      break
    case 'lt':
      sql = `${column} < ${formatLiteral(condition.value, fieldType, ctx)}`
      break
    case 'lte':
      sql = `${column} <= ${formatLiteral(condition.value, fieldType, ctx)}`
      break
    case 'like':
      sql = `${column} LIKE ${formatLiteral(formatLikeValue(condition.value, 'contains', ctx.escapeLike), 'string', ctx)}`
      break
    case 'notLike':
      sql = `${column} NOT LIKE ${formatLiteral(formatLikeValue(condition.value, 'contains', ctx.escapeLike), 'string', ctx)}`
      break
    case 'startsWith':
      sql = `${column} LIKE ${formatLiteral(formatLikeValue(condition.value, 'starts', ctx.escapeLike), 'string', ctx)}`
      break
    case 'endsWith':
      sql = `${column} LIKE ${formatLiteral(formatLikeValue(condition.value, 'ends', ctx.escapeLike), 'string', ctx)}`
      break
    case 'in': {
      const values = Array.isArray(condition.value) ? condition.value : [condition.value]
      const parts = values
        .filter(v => !isEmptyScalar(v))
        .map(v => formatLiteral(v, fieldType, ctx))
      sql = parts.length ? `${column} IN (${parts.join(', ')})` : ''
      break
    }
    case 'notIn': {
      const values = Array.isArray(condition.value) ? condition.value : [condition.value]
      const parts = values
        .filter(v => !isEmptyScalar(v))
        .map(v => formatLiteral(v, fieldType, ctx))
      sql = parts.length ? `${column} NOT IN (${parts.join(', ')})` : ''
      break
    }
    case 'isNull':
      sql = `${column} IS NULL`
      break
    case 'isNotNull':
      sql = `${column} IS NOT NULL`
      break
    case 'between': {
      const range = Array.isArray(condition.value) ? condition.value : [undefined, undefined]
      const [start, end] = range
      if (isEmptyScalar(start) || isEmptyScalar(end))
        return ''
      sql = `${column} BETWEEN ${formatLiteral(start, fieldType, ctx)} AND ${formatLiteral(end, fieldType, ctx)}`
      break
    }
    default:
      return ''
  }

  if (!sql)
    return ''
  return condition.not ? `NOT (${sql})` : sql
}

function compileSqlSearchNodeInternal(
  node: SqlSearchNode,
  ctx: CompileCtx,
): string {
  if (node.type === 'condition')
    return compileConditionSql(node, ctx)

  const parts = node.children
    .map(child => compileSqlSearchNodeInternal(child, ctx))
    .filter(Boolean)

  if (!parts.length)
    return ''

  const joiner = node.logic === 'and' ? ' AND ' : ' OR '
  let sql = parts.length === 1 ? parts[0]! : `(${parts.join(joiner)})`
  if (node.not)
    sql = `NOT (${sql})`
  return sql
}

function createCompileCtx(
  fields: SqlSearchFieldDef[],
  options: SqlSearchCompileOptions = {},
  parameterized = false,
): CompileCtx {
  return {
    fieldMap: buildFieldMap(fields),
    columnPattern: options.columnPattern ?? DEFAULT_COLUMN_PATTERN,
    escapeLike: options.escapeLike !== false,
    params: [],
    parameterized,
  }
}

export function compileSqlSearchNode(
  node: SqlSearchNode,
  fieldMap: Map<string, SqlSearchFieldDef>,
  options?: SqlSearchCompileOptions,
): string {
  const ctx: CompileCtx = {
    fieldMap,
    columnPattern: options?.columnPattern ?? DEFAULT_COLUMN_PATTERN,
    escapeLike: options?.escapeLike !== false,
    params: [],
    parameterized: false,
  }
  return compileSqlSearchNodeInternal(node, ctx)
}

export function compileSqlSearch(
  value: SqlSearchValue | undefined,
  fields: SqlSearchFieldDef[],
  options?: SqlSearchCompileOptions,
): string {
  if (!value)
    return ''
  const ctx = createCompileCtx(fields, options, false)
  return compileSqlSearchNodeInternal(value, ctx)
}

export function compileSqlSearchParameterized(
  value: SqlSearchValue | undefined,
  fields: SqlSearchFieldDef[],
  options?: SqlSearchCompileOptions,
): SqlParameterizedResult {
  if (!value)
    return { sql: '', params: [] }
  const ctx = createCompileCtx(fields, options, true)
  return {
    sql: compileSqlSearchNodeInternal(value, ctx),
    params: ctx.params,
  }
}

function normalizeParamValue(
  value: unknown,
  fieldType: SqlFieldType,
  operator: SqlCompareOperator,
): unknown {
  if (!operatorNeedsValue(operator))
    return undefined

  if (fieldType === 'boolean')
    return normalizeBooleanValue(value)

  if (fieldType === 'date' || fieldType === 'datetime') {
    if (operatorNeedsRangeValue(operator) && Array.isArray(value)) {
      return [
        formatSqlDateValue(value[0], fieldType),
        formatSqlDateValue(value[1], fieldType),
      ]
    }
    return formatSqlDateValue(value, fieldType)
  }

  if (operatorNeedsRangeValue(operator) && Array.isArray(value))
    return [value[0] ?? null, value[1] ?? null]

  if (operatorNeedsArrayValue(operator))
    return Array.isArray(value) ? value.filter(v => !isEmptyScalar(v)) : []

  return value
}

function toParamNode(
  node: SqlSearchNode,
  fieldMap: Map<string, SqlSearchFieldDef>,
  mode: SqlValidationMode,
): SqlSearchParamNode | null {
  if (node.type === 'condition') {
    if (mode === 'lenient' && isConditionBlank(node))
      return null
    if (!isConditionComplete(node, fieldMap))
      return null
    const fieldType = resolveFieldType(node.field, fieldMap)
    const param: SqlSearchParamCondition = {
      type: 'condition',
      field: node.field,
      column: resolveFieldColumn(node.field, fieldMap),
      operator: node.operator,
      value: normalizeParamValue(node.value, fieldType, node.operator),
    }
    if (node.not)
      param.not = true
    return param
  }

  const children = node.children
    .map(child => toParamNode(child, fieldMap, mode))
    .filter((child): child is SqlSearchParamNode => child != null)

  if (!children.length)
    return null

  const group: SqlSearchParamGroup = {
    type: 'group',
    logic: node.logic,
    children,
  }
  if (node.not)
    group.not = true
  return group
}

export function toSqlSearchParams(
  value: SqlSearchValue | undefined | null,
  fields: SqlSearchFieldDef[],
  mode: SqlValidationMode = 'strict',
): SqlSearchParams | null {
  if (!value)
    return null
  const fieldMap = buildFieldMap(fields)
  if (mode === 'strict' && !isSqlSearchComplete(value, 'strict', fields))
    return null
  const root = toParamNode(value, fieldMap, mode)
  if (!root || root.type !== 'group')
    return null
  return root
}

/** 裁剪未完成节点后导出（允许部分条件）；全空则 null */
export function toSqlSearchParamsPruned(
  value: SqlSearchValue | undefined | null,
  fields: SqlSearchFieldDef[],
): SqlSearchParams | null {
  return toSqlSearchParams(value, fields, 'lenient')
}

export function findParentGroupId(root: SqlSearchValue, nodeId: string): string {
  function walk(group: SqlSearchGroup): string | null {
    for (const child of group.children) {
      if (child.id === nodeId)
        return group.id
      if (child.type === 'group') {
        const found = walk(child)
        if (found)
          return found
      }
    }
    return null
  }
  return walk(root) ?? root.id
}

export function isSqlSearchGroup(node: SqlSearchNode | null | undefined): node is SqlSearchGroup {
  return !!node && node.type === 'group'
}

export function isSqlSearchCondition(node: SqlSearchNode | null | undefined): node is SqlSearchCondition {
  return !!node && node.type === 'condition'
}

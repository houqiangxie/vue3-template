import type { FieldOption } from '@/components/common/table/fieldSchema'

export type SqlFieldType = 'string' | 'number' | 'select' | 'date' | 'datetime' | 'boolean'

/** strict：每行须完整；lenient：忽略空白行，已填写的须完整（适合 SearchPanel） */
export type SqlValidationMode = 'strict' | 'lenient'

export interface SqlSearchFieldDef {
  key: string
  label: string
  /** 数据库列名，默认与 key 相同；须符合标识符规则 */
  column?: string
  type?: SqlFieldType
  options?: FieldOption[]
  /** 字段级覆盖可用操作符 */
  operators?: SqlCompareOperator[]
  /** 选字段后的默认操作符 */
  defaultOperator?: SqlCompareOperator
  placeholder?: string
  /** 不参与字段下拉 */
  hidden?: boolean
  /** 仅展示，不可编辑值（字段仍可选） */
  disabled?: boolean
}

export type SqlCompareOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'notLike'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'
  | 'between'

export interface SqlSearchCondition {
  type: 'condition'
  id: string
  field: string
  operator: SqlCompareOperator
  value?: unknown
  not?: boolean
}

export interface SqlSearchGroup {
  type: 'group'
  id: string
  logic: 'and' | 'or'
  not?: boolean
  children: SqlSearchNode[]
}

export type SqlSearchNode = SqlSearchCondition | SqlSearchGroup

export type SqlSearchValue = SqlSearchGroup

/** 提交给后端的结构化条件（不含 UI id） */
export interface SqlSearchParamCondition {
  type: 'condition'
  field: string
  column: string
  operator: SqlCompareOperator
  value?: unknown
  not?: boolean
}

export interface SqlSearchParamGroup {
  type: 'group'
  logic: 'and' | 'or'
  not?: boolean
  children: SqlSearchParamNode[]
}

export type SqlSearchParamNode = SqlSearchParamCondition | SqlSearchParamGroup

export type SqlSearchParams = SqlSearchParamGroup

/** 参数化 SQL（推荐后端使用） */
export interface SqlParameterizedResult {
  sql: string
  params: unknown[]
}

export interface SqlSearchCompileOptions {
  /** 列名白名单正则，默认 /^[a-zA-Z_][\w.]*$/ */
  columnPattern?: RegExp
  /** LIKE 是否转义 % _ */
  escapeLike?: boolean
}

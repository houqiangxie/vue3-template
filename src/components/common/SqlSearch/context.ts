import type { ComputedRef, InjectionKey } from 'vue'
import type { SqlSearchFieldDef, SqlValidationMode } from './types'
import type { SqlSearchTreeApi } from './useSqlSearchTree'

export interface SqlSearchSelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SqlSearchContext {
  fields: ComputedRef<SqlSearchFieldDef[]>
  fieldMap: ComputedRef<Map<string, SqlSearchFieldDef>>
  fieldOptions: ComputedRef<SqlSearchSelectOption[]>
  disabled: ComputedRef<boolean>
  validationMode: ComputedRef<SqlValidationMode>
  /** 校验触发后高亮未完成条件 */
  showIncomplete: ComputedRef<boolean>
  tree: SqlSearchTreeApi
}

export const SQL_SEARCH_CONTEXT_KEY: InjectionKey<SqlSearchContext> = Symbol('sqlSearchContext')

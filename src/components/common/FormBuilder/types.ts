import type { FormFieldConfig, NaiveComponentName, SearchFieldConfig, TableFieldConfig, UnifiedFieldConfig } from '@/components/common/table/fieldSchema'

export type VisibilityOperator = 'eq' | 'neq' | 'truthy' | 'empty' | 'gt' | 'lt' | 'includes'

export interface VisibilityCondition {
  fieldKey: string
  operator: VisibilityOperator
  value?: string
}

export interface VisibilityRule {
  logic: 'and' | 'or'
  conditions: VisibilityCondition[]
}

export interface BuilderField extends UnifiedFieldConfig {
  uid: string
  /** 设计器内存储的 visible 表达式，导出为 visibleExpr */
  _visibleExpr?: string
  /** 设计器内存储的 hidden 表达式，导出为 hiddenExpr */
  _hiddenExpr?: string
  /** 可视化联动条件，同步到 _visibleExpr / _hiddenExpr */
  _visibilityRule?: VisibilityRule
  /** 字典类型，导出为 dictType */
  _dictType?: string
  /** 自定义 render 函数体，导出为 renderExpr */
  _renderExpr?: string
  /** onChange 函数体，导出为 onChangeExpr */
  _onChangeExpr?: string
  /** 关闭场景开关时暂存配置，仅设计器内使用 */
  _formBackup?: FormFieldConfig
  _searchBackup?: SearchFieldConfig
  _tableBackup?: TableFieldConfig
}

export interface PaletteItem {
  label: string
  component: NaiveComponentName
  defaults?: Partial<BuilderField>
}

export interface PaletteGroup {
  name: string
  items: PaletteItem[]
}

/** v1：fields 为设计器 BuilderField（含 uid / _*）；无 version 为旧版导出结构 */
export interface FormBuilderDraft {
  version?: number
  fields: BuilderField[] | UnifiedFieldConfig[]
  formCols: number
  selectedUid: string
}

export type FormBuilderSaveStatus = 'idle' | 'pending' | 'saved' | 'error'

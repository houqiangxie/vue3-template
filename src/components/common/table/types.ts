/** TableAction 支持按行动态解析的字段值 */
export type TableActionRowValue<T, V> = V | ((row: T) => V)

/** TableAction Popconfirm 配置（按钮旁气泡确认） */
export interface TableActionPopconfirmConfig {
  title: string
  positiveText?: string
  negativeText?: string
}

/** TableAction Dialog 确认配置（居中弹窗确认） */
export interface TableActionConfirmConfig {
  /** 弹窗标题，默认「确认」 */
  title?: string
  /** 弹窗内容 */
  content: string
  positiveText?: string
  negativeText?: string
  /** dialog 类型，默认 warning */
  type?: 'warning' | 'info' | 'success' | 'error'
}

/** 表格行操作项配置 */
export interface TableActionItem<T = any> {
  /** 唯一标识，label 为函数时建议必传 */
  key?: string
  /** 按钮文案，支持按行动态 */
  label: TableActionRowValue<T, string>
  /** 权限码，支持单个或多个（满足其一即可） */
  permission?: string | string[]
  icon?: import('vue').Component
  /** 按钮类型，支持按行动态 */
  type?: TableActionRowValue<T, import('naive-ui').ButtonProps['type']>
  size?: import('naive-ui').ButtonProps['size']
  /** 是否显示，支持按行动态 */
  show?: boolean | ((row: T) => boolean)
  /** 是否禁用，支持按行动态 */
  disabled?: boolean | ((row: T) => boolean)
  /** 加载态，可与 Promise 点击自动 loading 叠加 */
  loading?: boolean | ((row: T) => boolean)
  /** 提示文案，支持按行动态 */
  tooltip?: string | ((row: T) => string)
  /**
   * 气泡二次确认（按钮旁提示）
   * 与 confirm 互斥，同时配置时优先 popconfirm
   */
  popconfirm?: TableActionRowValue<T, string | TableActionPopconfirmConfig>
  /** @deprecated 请使用 popconfirm */
  popConfirm?: TableActionRowValue<T, string | TableActionPopconfirmConfig>
  /**
   * 弹窗二次确认（dialog.confirm / dialog.warning）
   * 与 popconfirm 互斥，同时配置时优先 popconfirm
   */
  confirm?: TableActionRowValue<T, string | TableActionConfirmConfig>
  /** 排序权重，越小越靠前 */
  order?: number
  /** 强制放入「更多」菜单 */
  more?: boolean
  /** 分割线（用于下拉菜单） */
  divider?: boolean
  /** 作为下拉菜单触发按钮（通常配合 children） */
  dropdown?: boolean
  /** 子菜单 */
  children?: TableActionItem<T>[]
  /** 自定义渲染，传入后忽略默认按钮渲染 */
  render?: (row: T, ctx: TableActionRenderContext<T>) => import('vue').VNode | string
  /** 点击回调，返回 Promise 时自动进入 loading */
  onClick?: (row: T) => void | Promise<void>
}

/** TableAction 自定义 render 上下文 */
export interface TableActionRenderContext<T = any> {
  row: T
  disabled: boolean
  loading: boolean
  onClick: () => void | Promise<void>
}

/** 操作列 actions 回调：按行返回按钮配置 */
export type TableActionsResolver<T = any> = (row: T) => TableActionItem<T>[]

/** 列设置持久化项 */
export interface ColSettingItem {
  key: string
  label: string
  isShow: boolean
}

/** CommonTable CSV 导出选项（对齐 Naive UI downloadCsv） */
export interface TableCsvExportOptions {
  fileName?: string
  /** true：导出原始 data；false：导出当前页过滤/排序后的数据 */
  keepOriginalData?: boolean
}

/** CommonTable 工具栏导出配置 */
export interface TableCsvExportConfig {
  /** 文件名（不含扩展名） */
  fileName?: string
  /** 权限码 */
  permission?: string | string[]
  /** 自定义操作项；不传则默认「原始数据 / 展示数据」 */
  actions?: TableActionItem[]
}

/** CommonTable 对外导出方法 */
export interface CommonTableExportInst {
  downloadCsv: (options?: TableCsvExportOptions) => void
  exportOriginalData: (fileName?: string) => void
  exportDisplayData: (fileName?: string) => void
}

/** 排序状态（对齐 Naive UI SortState 常用字段） */
export interface TableSortState {
  columnKey: string | number
  order: 'ascend' | 'descend' | false
}

/** 列筛选状态（columnKey → 选中值） */
export type TableFilterState = Record<string, string | number | Array<string | number> | null>

/** 合计单元格 */
export interface TableSummaryCell {
  value?: import('vue').VNodeChild
  colSpan?: number
  rowSpan?: number
}

/** 合计行：函数，或按列 key 配置聚合 */
export type TableSummaryConfig =
  | ((pageData: Record<string, unknown>[]) => Record<string, TableSummaryCell> | Array<Record<string, TableSummaryCell>>)
  | {
      /** 首列文案，默认「合计」 */
      label?: string
      /** 文案落在哪一列，默认第一数据列；传 `__index` / selection 旁列 key */
      labelKey?: string
      /** 列聚合：sum / count / avg，或自定义 */
      columns: Record<string, 'sum' | 'count' | 'avg' | ((pageData: Record<string, unknown>[]) => import('vue').VNodeChild)>
    }

/** 展开行配置（也可只开 expand + 使用 #expand 插槽） */
export interface TableExpandConfig<T = Record<string, unknown>> {
  /** 展开区渲染；有 #expand 插槽时优先插槽 */
  render?: (row: T, index: number) => import('vue').VNode | string
  /** 是否可展开，默认均可 */
  expandable?: (row: T) => boolean
  /** 展开列宽度 */
  width?: number
}

/** 树表配置（对应 Naive UI childrenKey / defaultExpandAll / indent） */
export interface TableTreeConfig {
  /** 子节点字段，默认 children */
  childrenKey?: string
  /** 默认展开全部 */
  defaultExpandAll?: boolean
  /** 缩进像素 */
  indent?: number
}

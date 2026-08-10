import type { VNode } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import type { FormConfigItem, UnifiedFieldConfig } from '../table/fieldSchema'

export interface ModalFormSection {
  type: 'form'
  key?: string
  title?: string
  description?: string
  fields?: UnifiedFieldConfig[]
  config?: FormConfigItem[]
  formProps?: Record<string, unknown>
}

export interface ModalTableSection {
  type: 'table'
  key?: string
  title?: string
  description?: string
  fields?: UnifiedFieldConfig[]
  columns?: DataTableColumns
  /** 静态表格数据；动态数据建议用 CommonModal 的 tableData prop 按 key 传入 */
  data?: Record<string, unknown>[]
  tableProps?: Record<string, unknown>
  showPagination?: boolean
}

export interface ModalRenderSection {
  type: 'render'
  key?: string
  title?: string
  render: () => VNode | VNode[] | string
}

export interface ModalSlotSection {
  type: 'slot'
  key?: string
  title?: string
  /** 对应 CommonModal 具名插槽名 */
  slotName: string
}

export type ModalSection = ModalFormSection | ModalTableSection | ModalRenderSection | ModalSlotSection

export interface ModalConfig {
  title?: string
  description?: string
  width?: number | string
  /** 弹窗最大高度，超出时仅内容区滚动 */
  maxHeight?: number | string
  preset?: 'dialog' | 'card'
  /** 是否可拖拽，默认 true */
  draggable?: boolean | Record<string, unknown>
  maskClosable?: boolean
  closable?: boolean
  showFooter?: boolean
  confirmText?: string
  cancelText?: string
  /** 弹窗内容区块；不传则使用 default 插槽 */
  sections?: ModalSection[]
}

/** 创建弹窗配置 */
export function defineModal(config: ModalConfig) {
  return config
}

/**
 * @example
 * export const editUserModal = defineModal({
 *   title: '编辑用户',
 *   width: 720,
 *   sections: [
 *     { type: 'form', key: 'main', fields: userPageFields },
 *     { type: 'table', key: 'logs', title: '操作日志', fields: logFields, showPagination: false },
 *   ],
 * })
 *
 * <CommonModal
 *   v-model:show="visible"
 *   v-model:form-model="formData"
 *   :config="editUserModal"
 *   :table-data="{ logs: logList }"
 *   @confirm="handleSave"
 * />
 */

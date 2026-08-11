/**
 * 页面侧常用的字段 / 弹窗 schema 工具。
 * 集中 re-export，避免把 components 下内部 util 全量加入 AutoImport。
 */
export {
  defineFields,
  extractFormDefaults,
  extractSearchDefaults,
} from '@/components/common/table/fieldSchema'

export { defineModal } from '@/components/common/modal/modalSchema'

import type { GenTable, GenTableColumn, PageQuery, PageResult } from './types'
import { del, get, post, put } from '@/utils/fetch'

export interface GenTableDetail {
  info: GenTable
  rows: GenTableColumn[]
  tables?: GenTable[]
}

/** 代码生成表分页 */
export function listGenTable(query: PageQuery = {}) {
  return get<PageResult<GenTable>>('/tool/gen/list', query)
}

/** 表详情（含列） */
export function getGenTable(tableId: number) {
  return get<GenTableDetail>(`/tool/gen/${tableId}`)
}

/** 修改生成配置 */
export function updateGenTable(data: { info: Partial<GenTable>, rows: GenTableColumn[] }) {
  return put('/tool/gen', data)
}

/** 删除生成表 */
export function deleteGenTable(tableIds: number[]) {
  return del(`/tool/gen/${tableIds.join(',')}`)
}

/** 数据库表列表（待导入） */
export function listDbTable(query: PageQuery = {}) {
  return get<PageResult<GenTable>>('/tool/gen/db/list', query)
}

/** 导入表结构 */
export function importGenTable(tables: string) {
  return post('/tool/gen/importTable', { tables })
}

/** 预览代码 */
export function previewGenCode(tableId: number) {
  return get<Record<string, string>>(`/tool/gen/preview/${tableId}`)
}

/** 同步数据库 */
export function synchDb(tableName: string) {
  return get(`/tool/gen/synchDb/${tableName}`)
}

/**
 * 生成到自定义路径（genType=1）
 * Mock 仅标记成功；真实后端写盘
 */
export function genCode(tableName: string) {
  return get(`/tool/gen/genCode/${tableName}`)
}

/** 单表下载 zip（genType=0），配合 useDownload */
export function downloadGenCodePath(tableName: string) {
  return `/tool/gen/download/${encodeURIComponent(tableName)}`
}

/** 批量生成 zip，配合 useDownload：params.tables = 'a,b,c' */
export const batchGenCodePath = '/tool/gen/batchGenCode'

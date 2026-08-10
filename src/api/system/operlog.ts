import type { PageQuery, PageResult, SysOperLog } from './types'
import { del, get } from '@/utils/fetch'

/** 操作日志分页 */
export function listOperLog(query: PageQuery = {}) {
  return get<PageResult<SysOperLog>>('/system/operlog/list', query)
}

/** 删除操作日志 */
export function deleteOperLog(operIds: number[]) {
  return del(`/system/operlog/${operIds.join(',')}`)
}

/** 清空操作日志 */
export function cleanOperLog() {
  return del('/system/operlog/clean')
}

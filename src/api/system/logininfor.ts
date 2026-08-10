import type { PageQuery, PageResult, SysLogininfor } from './types'
import { del, get } from '@/utils/fetch'

/** 登录日志分页 */
export function listLogininfor(query: PageQuery = {}) {
  return get<PageResult<SysLogininfor>>('/system/logininfor/list', query)
}

/** 删除登录日志 */
export function deleteLogininfor(infoIds: number[]) {
  return del(`/system/logininfor/${infoIds.join(',')}`)
}

/** 清空登录日志 */
export function cleanLogininfor() {
  return del('/system/logininfor/clean')
}

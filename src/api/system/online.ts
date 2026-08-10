import type { PageQuery, PageResult, SysUserOnline } from './types'
import { del, get } from '@/utils/fetch'

/** 在线用户分页 */
export function listOnline(query: PageQuery = {}) {
  return get<PageResult<SysUserOnline>>('/monitor/online/list', query)
}

/** 强退用户 */
export function forceLogout(tokenId: string) {
  return del(`/monitor/online/${tokenId}`)
}

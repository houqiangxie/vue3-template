import type { PageQuery, PageResult, SysNotice } from './types'
import { del, get, post, put } from '@/utils/fetch'

/** 通知分页 */
export function listNotice(query: PageQuery = {}) {
  return get<PageResult<SysNotice>>('/system/notice/list', query)
}

/** 通知详情 */
export function getNotice(noticeId: number) {
  return get<SysNotice>(`/system/notice/${noticeId}`)
}

/** 新增通知 */
export function addNotice(data: Partial<SysNotice>) {
  return post('/system/notice', data)
}

/** 修改通知 */
export function updateNotice(data: Partial<SysNotice>) {
  return put('/system/notice', data)
}

/** 删除通知 */
export function deleteNotice(noticeIds: number[]) {
  return del(`/system/notice/${noticeIds.join(',')}`)
}

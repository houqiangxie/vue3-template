import type { PageQuery, PageResult, SysPost } from './types'
import { del, get, post, put } from '@/utils/fetch'

/** 岗位分页 */
export function listPost(query: PageQuery = {}) {
  return get<PageResult<SysPost>>('/system/post/list', query)
}

/** 岗位详情 */
export function getPost(postId: number) {
  return get<SysPost>(`/system/post/${postId}`)
}

/** 新增岗位 */
export function addPost(data: Partial<SysPost>) {
  return post('/system/post', data)
}

/** 修改岗位 */
export function updatePost(data: Partial<SysPost>) {
  return put('/system/post', data)
}

/** 删除岗位 */
export function deletePost(postIds: number[]) {
  return del(`/system/post/${postIds.join(',')}`)
}

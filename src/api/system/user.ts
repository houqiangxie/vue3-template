import type { PageQuery, PageResult, SysUser } from './types'
import { del, get, post, put } from '@/utils/fetch'
import { listPost } from './post'
import { listRole } from './role'

/** 用户分页列表 */
export function listUser(query: PageQuery = {}) {
  return get<PageResult<SysUser>>('/system/user/list', query)
}

/** 用户详情 */
export function getUser(userId: number) {
  return get<SysUser>(`/system/user/${userId}`)
}

/** 新增用户 */
export function addUser(data: Partial<SysUser>) {
  return post('/system/user', data)
}

/** 修改用户 */
export function updateUser(data: Partial<SysUser>) {
  return put('/system/user', data)
}

/** 删除用户 */
export function deleteUser(userIds: number[]) {
  return del(`/system/user/${userIds.join(',')}`)
}

/** 重置密码 */
export function resetUserPwd(userId: number, password: string) {
  return put('/system/user/resetPwd', { userId, password })
}

/** 修改用户状�?*/
export function changeUserStatus(userId: number, status: '0' | '1') {
  return put('/system/user/changeStatus', { userId, status })
}

/** 角色下拉选项 */
export async function getUserRoleOptions() {
  const { data } = await listRole({ pageNum: 1, pageSize: 100, status: '0' })
  return (data?.rows ?? []).map(r => ({ label: r.roleName, value: r.roleId }))
}

/** 岗位下拉选项 */
export async function getUserPostOptions() {
  const { data } = await listPost({ pageNum: 1, pageSize: 100, status: '0' })
  return (data?.rows ?? []).map(p => ({ label: p.postName, value: p.postId }))
}

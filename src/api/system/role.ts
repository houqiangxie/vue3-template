import type { PageQuery, PageResult, SysRole, SysUser } from './types'
import { getRoleMenuIds } from './menu'
import { del, get, post, put } from '@/utils/fetch'

/** 角色分页列表 */
export function listRole(query: PageQuery = {}) {
  return get<PageResult<SysRole>>('/system/role/list', query)
}

/** 角色详情 */
export async function getRole(roleId: number) {
  const res = await get<SysRole & { menuIds?: number[] }>(`/system/role/${roleId}`)
  if (!res.data?.menuIds?.length) {
    try {
      const menuRes = await getRoleMenuIds(roleId)
      if (res.data)
        res.data.menuIds = menuRes.data?.checkedKeys ?? []
    }
    catch {
      // 后端若已在详情中返回 menuIds，则无需额外请求
    }
  }
  return res
}

/** 新增角色 */
export function addRole(data: Partial<SysRole>) {
  return post('/system/role', data)
}

/** 修改角色 */
export function updateRole(data: Partial<SysRole>) {
  return put('/system/role', data)
}

/** 删除角色 */
export function deleteRole(roleIds: number[]) {
  return del(`/system/role/${roleIds.join(',')}`)
}

/** 修改角色状态 */
export function changeRoleStatus(roleId: number, status: '0' | '1') {
  return put('/system/role/changeStatus', { roleId, status })
}

/** 分配角色菜单权限 */
export function updateRoleMenu(roleId: number, menuIds: number[]) {
  return put('/system/role/authMenu', { roleId, menuIds })
}

/** 已分配用户列表 */
export function allocatedUserList(query: PageQuery & { roleId: number }) {
  return get<PageResult<SysUser>>('/system/role/authUser/allocatedList', query)
}

/** 未分配用户列表 */
export function unallocatedUserList(query: PageQuery & { roleId: number }) {
  return get<PageResult<SysUser>>('/system/role/authUser/unallocatedList', query)
}

/** 取消授权 */
export function authUserCancel(data: { userId: number, roleId: number }) {
  return put('/system/role/authUser/cancel', data)
}

/** 批量取消授权 */
export function authUserCancelAll(data: { roleId: number, userIds: number[] }) {
  return put('/system/role/authUser/cancelAll', data)
}

/** 批量选择用户授权 */
export function authUserSelectAll(data: { roleId: number, userIds: number[] }) {
  return put('/system/role/authUser/selectAll', data)
}

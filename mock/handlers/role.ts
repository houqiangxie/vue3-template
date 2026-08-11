import type { SysRole } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, ok, pageOk } from '../utils'
import { genRoleId, resolveRoleNames, roles, stampCreateTime, users } from '../data/store'

function filterUsersByRole(roleId: number, allocated: boolean) {
  return users.filter((u) => {
    const has = (u.roleIds || []).includes(roleId)
    return allocated ? has : !has
  })
}

export const roleRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/role/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...roles]

      const roleName = req.query.roleName?.trim()
      const roleKey = req.query.roleKey?.trim()
      const status = req.query.status
      const beginTime = req.query.beginTime?.trim()
      const endTime = req.query.endTime?.trim()
      if (roleName)
        list = list.filter(r => r.roleName.includes(roleName))
      if (roleKey)
        list = list.filter(r => r.roleKey.includes(roleKey))
      if (status !== undefined && status !== '')
        list = list.filter(r => r.status === status)
      if (beginTime)
        list = list.filter(r => (r.createTime || '') >= beginTime)
      if (endTime)
        list = list.filter(r => (r.createTime || '') <= `${endTime} 23:59:59`)

      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/system/role/authUser/allocatedList',
    handler: (req) => {
      const roleId = Number(req.query.roleId)
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = filterUsersByRole(roleId, true)
      const userName = req.query.userName?.trim()
      const phonenumber = req.query.phonenumber?.trim()
      if (userName)
        list = list.filter(u => u.userName.includes(userName))
      if (phonenumber)
        list = list.filter(u => (u.phonenumber || '').includes(phonenumber))
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/system/role/authUser/unallocatedList',
    handler: (req) => {
      const roleId = Number(req.query.roleId)
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = filterUsersByRole(roleId, false)
      const userName = req.query.userName?.trim()
      const phonenumber = req.query.phonenumber?.trim()
      if (userName)
        list = list.filter(u => u.userName.includes(userName))
      if (phonenumber)
        list = list.filter(u => (u.phonenumber || '').includes(phonenumber))
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'PUT',
    path: '/system/role/authUser/cancel',
    handler: (req) => {
      const userId = Number(req.body?.userId)
      const roleId = Number(req.body?.roleId)
      const user = users.find(u => u.userId === userId)
      if (!user)
        return fail('用户不存在')
      user.roleIds = (user.roleIds || []).filter(id => id !== roleId)
      user.roleNames = resolveRoleNames(user.roleIds)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/role/authUser/cancelAll',
    handler: (req) => {
      const roleId = Number(req.body?.roleId)
      const userIds = (req.body?.userIds || []) as number[]
      users.forEach((u) => {
        if (userIds.includes(u.userId)) {
          u.roleIds = (u.roleIds || []).filter(id => id !== roleId)
          u.roleNames = resolveRoleNames(u.roleIds)
        }
      })
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/role/authUser/selectAll',
    handler: (req) => {
      const roleId = Number(req.body?.roleId)
      const userIds = (req.body?.userIds || []) as number[]
      users.forEach((u) => {
        if (userIds.includes(u.userId)) {
          const ids = new Set(u.roleIds || [])
          ids.add(roleId)
          u.roleIds = [...ids]
          u.roleNames = resolveRoleNames(u.roleIds)
        }
      })
      return ok(null)
    },
  },
  {
    method: 'GET',
    path: '/system/role/:roleId',
    handler: (req) => {
      const roleId = Number(req.params.roleId)
      const role = roles.find(r => r.roleId === roleId)
      if (!role)
        return fail('角色不存在')
      return ok({ ...role })
    },
  },
  {
    method: 'POST',
    path: '/system/role',
    handler: (req) => {
      const body = req.body as Partial<SysRole>
      if (!body.roleName || !body.roleKey)
        return fail('角色名称和权限字符不能为空')
      const row = stampCreateTime({
        roleId: genRoleId(),
        roleName: body.roleName,
        roleKey: body.roleKey,
        roleSort: body.roleSort ?? roles.length + 1,
        status: body.status || '1',
        menuIds: body.menuIds || [],
        remark: body.remark,
      } as SysRole)
      roles.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/role',
    handler: (req) => {
      const body = req.body as Partial<SysRole>
      const idx = roles.findIndex(r => r.roleId === body.roleId)
      if (idx < 0)
        return fail('角色不存在')
      roles[idx] = { ...roles[idx], ...body, roleId: roles[idx].roleId }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/role/:roleIds',
    handler: (req) => {
      const ids = req.params.roleIds.split(',').map(Number)
      for (let i = roles.length - 1; i >= 0; i--) {
        if (ids.includes(roles[i].roleId))
          roles.splice(i, 1)
      }
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/role/authMenu',
    handler: (req) => {
      const roleId = Number(req.body?.roleId)
      const menuIds = (req.body?.menuIds || []) as number[]
      const role = roles.find(r => r.roleId === roleId)
      if (!role)
        return fail('角色不存在')
      role.menuIds = menuIds
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/role/changeStatus',
    handler: (req) => {
      const body = req.body as { roleId?: number, status?: '0' | '1' }
      const role = roles.find(r => r.roleId === Number(body.roleId))
      if (!role)
        return fail('角色不存在')
      if (body.status === '0' || body.status === '1')
        role.status = body.status
      return ok(null)
    },
  },
]

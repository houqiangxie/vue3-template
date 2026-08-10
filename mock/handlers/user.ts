import type { SysUser } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, ok, pageOk } from '../utils'
import {
  genUserId,
  resolveDeptName,
  resolveRoleNames,
  stampCreateTime,
  users,
} from '../data/store'

function enrich(user: SysUser): SysUser {
  return {
    ...user,
    deptName: resolveDeptName(user.deptId),
    roleNames: resolveRoleNames(user.roleIds),
  }
}

export const userRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/user/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = users.map(enrich)

      const userName = req.query.userName?.trim()
      const phonenumber = req.query.phonenumber?.trim()
      const status = req.query.status
      const deptId = req.query.deptId
      const beginTime = req.query.beginTime?.trim()
      const endTime = req.query.endTime?.trim()
      if (userName)
        list = list.filter(u => u.userName.includes(userName) || u.nickName.includes(userName))
      if (phonenumber)
        list = list.filter(u => u.phonenumber?.includes(phonenumber))
      if (status !== undefined && status !== '')
        list = list.filter(u => u.status === status)
      if (deptId !== undefined && deptId !== '')
        list = list.filter(u => u.deptId === Number(deptId))
      if (beginTime)
        list = list.filter(u => (u.createTime || '') >= beginTime)
      if (endTime)
        list = list.filter(u => (u.createTime || '') <= `${endTime} 23:59:59`)

      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'GET',
    path: '/system/user/:userId',
    handler: (req) => {
      const userId = Number(req.params.userId)
      const user = users.find(u => u.userId === userId)
      if (!user)
        return fail('用户不存在')
      return ok(enrich(user))
    },
  },
  {
    method: 'POST',
    path: '/system/user',
    handler: (req) => {
      const body = req.body as Partial<SysUser>
      if (!body.userName)
        return fail('用户名不能为空')
      if (users.some(u => u.userName === body.userName))
        return fail('用户名已存在')

      const row = stampCreateTime({
        userId: genUserId(),
        userName: body.userName,
        nickName: body.nickName || body.userName,
        deptId: body.deptId,
        phonenumber: body.phonenumber,
        email: body.email,
        sex: body.sex || '2',
        status: body.status || '0',
        postIds: body.postIds || [],
        roleIds: body.roleIds || [],
        remark: body.remark,
      } as SysUser)
      users.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/user',
    handler: (req) => {
      const body = req.body as Partial<SysUser>
      const idx = users.findIndex(u => u.userId === body.userId)
      if (idx < 0)
        return fail('用户不存在')
      users[idx] = {
        ...users[idx],
        ...body,
        userId: users[idx].userId,
      }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/user/:userIds',
    handler: (req) => {
      const ids = req.params.userIds.split(',').map(Number)
      for (let i = users.length - 1; i >= 0; i--) {
        if (ids.includes(users[i].userId))
          users.splice(i, 1)
      }
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/user/resetPwd',
    handler: () => ok(null),
  },
  {
    method: 'PUT',
    path: '/system/user/changeStatus',
    handler: (req) => {
      const body = req.body as { userId?: number, status?: '0' | '1' }
      const user = users.find(u => u.userId === Number(body.userId))
      if (!user)
        return fail('用户不存在')
      if (body.status === '0' || body.status === '1')
        user.status = body.status
      return ok(null)
    },
  },
]

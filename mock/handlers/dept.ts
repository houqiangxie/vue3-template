import type { SysDept } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, ok } from '../utils'
import { depts, genDeptId, stampCreateTime } from '../data/store'

export const deptRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/dept/list',
    handler: (req) => {
      let list = [...depts]
      const deptName = req.query.deptName?.trim()
      const status = req.query.status
      if (deptName)
        list = list.filter(d => d.deptName.includes(deptName))
      if (status !== undefined && status !== '')
        list = list.filter(d => d.status === status)
      return ok(list)
    },
  },
  {
    method: 'GET',
    path: '/system/dept/:deptId',
    handler: (req) => {
      const deptId = Number(req.params.deptId)
      const dept = depts.find(d => d.deptId === deptId)
      if (!dept)
        return fail('部门不存在')
      return ok({ ...dept })
    },
  },
  {
    method: 'POST',
    path: '/system/dept',
    handler: (req) => {
      const body = req.body as Partial<SysDept>
      if (!body.deptName)
        return fail('部门名称不能为空')
      const row = stampCreateTime({
        deptId: genDeptId(),
        parentId: body.parentId ?? 0,
        deptName: body.deptName,
        orderNum: body.orderNum ?? 0,
        leader: body.leader,
        phone: body.phone,
        email: body.email,
        status: body.status || '1',
      } as SysDept)
      depts.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/dept',
    handler: (req) => {
      const body = req.body as Partial<SysDept>
      const idx = depts.findIndex(d => d.deptId === body.deptId)
      if (idx < 0)
        return fail('部门不存在')
      depts[idx] = { ...depts[idx], ...body, deptId: depts[idx].deptId }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/dept/:deptId',
    handler: (req) => {
      const deptId = Number(req.params.deptId)
      if (depts.some(d => d.parentId === deptId))
        return fail('存在子部门，无法删除')
      const idx = depts.findIndex(d => d.deptId === deptId)
      if (idx < 0)
        return fail('部门不存在')
      depts.splice(idx, 1)
      return ok(null)
    },
  },
]

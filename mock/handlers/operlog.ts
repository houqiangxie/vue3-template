import type { MockRoute } from '../utils'
import { ok, pageOk } from '../utils'
import { operLogs } from '../data/store'

export const operlogRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/operlog/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...operLogs]
      const title = req.query.title?.trim()
      const operName = req.query.operName?.trim()
      const operIp = req.query.operIp?.trim()
      const businessType = req.query.businessType
      const status = req.query.status
      const beginTime = req.query.beginTime
      const endTime = req.query.endTime
      if (title)
        list = list.filter(l => l.title.includes(title))
      if (operName)
        list = list.filter(l => (l.operName || '').includes(operName))
      if (operIp)
        list = list.filter(l => (l.operIp || '').includes(operIp))
      if (businessType !== undefined && businessType !== '')
        list = list.filter(l => String(l.businessType) === String(businessType))
      if (status !== undefined && status !== '')
        list = list.filter(l => l.status === status)
      if (beginTime)
        list = list.filter(l => String(l.operTime || '') >= String(beginTime))
      if (endTime)
        list = list.filter(l => String(l.operTime || '') <= String(endTime))
      list.sort((a, b) => String(b.operTime).localeCompare(String(a.operTime)))
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'DELETE',
    path: '/system/operlog/clean',
    handler: () => {
      operLogs.splice(0, operLogs.length)
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/operlog/:operIds',
    handler: (req) => {
      const ids = req.params.operIds.split(',').map(Number)
      for (let i = operLogs.length - 1; i >= 0; i--) {
        if (ids.includes(operLogs[i].operId))
          operLogs.splice(i, 1)
      }
      return ok(null)
    },
  },
]

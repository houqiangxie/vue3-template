import type { MockRoute } from '../utils'
import { ok, pageOk } from '../utils'
import { logininfors } from '../data/store'

export const logininforRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/logininfor/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...logininfors]
      const userName = req.query.userName?.trim()
      const ipaddr = req.query.ipaddr?.trim()
      const status = req.query.status
      if (userName)
        list = list.filter(l => l.userName.includes(userName))
      if (ipaddr)
        list = list.filter(l => (l.ipaddr || '').includes(ipaddr))
      if (status !== undefined && status !== '')
        list = list.filter(l => l.status === status)
      list.sort((a, b) => String(b.loginTime).localeCompare(String(a.loginTime)))
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'DELETE',
    path: '/system/logininfor/clean',
    handler: () => {
      logininfors.splice(0, logininfors.length)
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/logininfor/:infoIds',
    handler: (req) => {
      const ids = req.params.infoIds.split(',').map(Number)
      for (let i = logininfors.length - 1; i >= 0; i--) {
        if (ids.includes(logininfors[i].infoId))
          logininfors.splice(i, 1)
      }
      return ok(null)
    },
  },
]

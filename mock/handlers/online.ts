import type { MockRoute } from '../utils'
import { fail, ok, pageOk } from '../utils'
import { onlines } from '../data/store'

export const onlineRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/monitor/online/list',
    handler: (req) => {
      const pageNum = Number(req.query.pageNum || 1)
      const pageSize = Number(req.query.pageSize || 10)
      let list = [...onlines]
      const ipaddr = req.query.ipaddr?.trim()
      const userName = req.query.userName?.trim()
      if (ipaddr)
        list = list.filter(o => (o.ipaddr || '').includes(ipaddr))
      if (userName)
        list = list.filter(o => o.userName.includes(userName))
      list.sort((a, b) => String(b.loginTime || '').localeCompare(String(a.loginTime || '')))
      const start = (pageNum - 1) * pageSize
      return pageOk(list.slice(start, start + pageSize), list.length)
    },
  },
  {
    method: 'DELETE',
    path: '/monitor/online/:tokenId',
    handler: (req) => {
      const tokenId = req.params.tokenId
      const idx = onlines.findIndex(o => o.tokenId === tokenId)
      if (idx < 0)
        return fail('会话不存在或已下线')
      onlines.splice(idx, 1)
      return ok(null)
    },
  },
]

import type { MockRoute } from '../utils'
import { ok } from '../utils'
import { logininfors, notices, onlines, operLogs, users } from '../data/store'

function last7Days() {
  const days: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export const dashboardRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/dashboard/stats',
    handler: () => {
      const today = new Date().toISOString().slice(0, 10)
      const deptMap = new Map<string, number>()
      users.forEach((u) => {
        const name = u.deptName || '未分配'
        deptMap.set(name, (deptMap.get(name) || 0) + 1)
      })

      const moduleMap = new Map<string, number>()
      operLogs.forEach((log) => {
        const name = log.title || '其它'
        moduleMap.set(name, (moduleMap.get(name) || 0) + 1)
      })

      const days = last7Days()
      const loginTrend = days.map((date) => {
        const count = logininfors.filter(l =>
          String(l.loginTime).startsWith(date) && l.status === '1',
        ).length
        return { date: date.slice(5), count: count || Math.floor(Math.random() * 5) + 1 }
      })

      return ok({
        userTotal: users.length,
        onlineTotal: onlines.length,
        noticeTotal: notices.filter(n => n.status === '1').length,
        operlogToday: operLogs.filter(l => String(l.operTime).startsWith(today)).length || 3,
        loginTrend,
        userByDept: [...deptMap.entries()].map(([name, value]) => ({ name, value })),
        operlogByModule: [...moduleMap.entries()].map(([name, value]) => ({ name, value })),
      })
    },
  },
]

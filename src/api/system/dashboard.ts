import { get } from '@/utils/fetch'

export interface DashboardStats {
  userTotal: number
  onlineTotal: number
  noticeTotal: number
  operlogToday: number
  loginTrend: { date: string, count: number }[]
  userByDept: { name: string, value: number }[]
  operlogByModule: { name: string, value: number }[]
}

/** 首页仪表盘统计数据 */
export function getDashboardStats() {
  return get<DashboardStats>('/dashboard/stats')
}

import type { ServerInfo } from './types'
import { get } from '@/utils/fetch'

/** 服务监控信息 */
export function getServer() {
  return get<ServerInfo>('/monitor/server')
}

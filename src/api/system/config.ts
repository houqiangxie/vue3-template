import type { PageQuery, PageResult, SysConfig } from './types'
import { del, get, post, put } from '@/utils/fetch'

/** 参数分页 */
export function listConfig(query: PageQuery = {}) {
  return get<PageResult<SysConfig>>('/system/config/list', query)
}

/** 参数详情 */
export function getConfig(configId: number) {
  return get<SysConfig>(`/system/config/${configId}`)
}

/** �?key 查参数�?*/
export function getConfigKey(configKey: string) {
  return get<string>(`/system/config/configKey/${configKey}`)
}

/** 新增参数 */
export function addConfig(data: Partial<SysConfig>) {
  return post('/system/config', data)
}

/** 修改参数 */
export function updateConfig(data: Partial<SysConfig>) {
  return put('/system/config', data)
}

/** 删除参数 */
export function deleteConfig(configIds: number[]) {
  return del(`/system/config/${configIds.join(',')}`)
}

/** 刷新参数缓存 */
export function refreshConfigCache() {
  return del('/system/config/refreshCache')
}

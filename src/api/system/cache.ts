import type { CacheInfo, CacheKV, CacheName } from './types'
import { del, get } from '@/utils/fetch'

/** 缓存监控概览 */
export function getCache() {
  return get<CacheInfo>('/monitor/cache')
}

/** 缓存名称列表 */
export function listCacheName() {
  return get<CacheName[]>('/monitor/cache/getNames')
}

/** 某缓存下的键列表 */
export function listCacheKey(cacheName: string) {
  return get<string[]>(`/monitor/cache/getKeys/${encodeURIComponent(cacheName)}`)
}

/** 缓存键值详情 */
export function getCacheValue(cacheName: string, cacheKey: string) {
  return get<CacheKV>(`/monitor/cache/getValue/${encodeURIComponent(cacheName)}/${encodeURIComponent(cacheKey)}`)
}

/** 清理指定名称缓存 */
export function clearCacheName(cacheName: string) {
  return del(`/monitor/cache/clearCacheName/${encodeURIComponent(cacheName)}`)
}

/** 清理指定键 */
export function clearCacheKey(cacheKey: string) {
  return del(`/monitor/cache/clearCacheKey/${encodeURIComponent(cacheKey)}`)
}

/** 清理全部缓存 */
export function clearCacheAll() {
  return del('/monitor/cache/clearCacheAll')
}

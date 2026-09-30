/**
 * BPM / Flowable API 前缀。
 * 默认 `/jgzf-flowable` 兼容芋道网关；可通过 `VITE_BPM_API_PREFIX` 覆盖。
 */
export const BPM_API_PREFIX = String(import.meta.env.VITE_BPM_API_PREFIX || '/jgzf-flowable').replace(/\/$/, '')

/**
 * 将业务侧 `/bpm/...` 解析为带网关前缀的路径。
 * 已含当前前缀、或历史 `/jgzf-flowable` 前缀时会归一到 `BPM_API_PREFIX`。
 */
export function resolveBpmUrl(url: string): string {
  if (!url)
    return url

  if (url.startsWith(`${BPM_API_PREFIX}/`) || url === BPM_API_PREFIX)
    return url

  if (url.startsWith('/bpm/') || url === '/bpm')
    return `${BPM_API_PREFIX}${url}`

  // 兼容仓库内旧硬编码，便于渐进迁移
  if (url.startsWith('/jgzf-flowable/'))
    return `${BPM_API_PREFIX}${url.slice('/jgzf-flowable'.length)}`
  if (url === '/jgzf-flowable')
    return BPM_API_PREFIX

  return url
}

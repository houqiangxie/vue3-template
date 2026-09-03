import {
  IFRAME_BRIDGE_INSTALLED_KEY,
  IFRAME_BRIDGE_KIND_KEY,
  IFRAME_BRIDGE_SOURCE,
  type IframeBridgeEnvelope,
  type IframeBridgeKind,
  type IframeBridgeWindowFlags,
  type IframeMessageType,
} from './types'

export * from './types'
export {
  injectChildBridge,
  canAccessIframeDocument,
  getIframeBridgeScriptUrl,
  type InjectChildBridgeOptions,
} from './inject'

function bridgeWindow(win: Window = window): Window & IframeBridgeWindowFlags {
  return win as Window & IframeBridgeWindowFlags
}

/** 是否已安装桥（Vue 或 script，互斥） */
export function isIframeBridgeInstalled(win: Window = window): boolean {
  return !!bridgeWindow(win)[IFRAME_BRIDGE_INSTALLED_KEY]
}

/** 标记已安装；若已被其他实现占用则返回 false */
export function markIframeBridgeInstalled(
  kind: IframeBridgeKind,
  win: Window = window,
): boolean {
  const w = bridgeWindow(win)
  if (w[IFRAME_BRIDGE_INSTALLED_KEY])
    return false
  w[IFRAME_BRIDGE_INSTALLED_KEY] = true
  w[IFRAME_BRIDGE_KIND_KEY] = kind
  return true
}

/** 仅清理本 kind 的安装标记 */
export function unmarkIframeBridgeInstalled(
  kind: IframeBridgeKind,
  win: Window = window,
): void {
  const w = bridgeWindow(win)
  if (w[IFRAME_BRIDGE_KIND_KEY] === kind) {
    delete w[IFRAME_BRIDGE_INSTALLED_KEY]
    delete w[IFRAME_BRIDGE_KIND_KEY]
  }
}

/**
 * 解析子应用应信任的父页面 origin。
 * 返回 null 表示不限制（仅建议开发态或显式配置 '*'）。
 */
export function resolveTrustedParentOrigin(options?: {
  trustedParentOrigin?: string
  targetOrigin?: string
}): string | null {
  const explicit = options?.trustedParentOrigin
  if (explicit === '*')
    return null
  if (explicit)
    return explicit

  const target = options?.targetOrigin
  if (target && target !== '*')
    return target

  try {
    const ancestors = (window.location as Location & { ancestorOrigins?: DOMStringList }).ancestorOrigins
    if (ancestors?.length)
      return ancestors[0]
    if (document.referrer)
      return new URL(document.referrer).origin
  }
  catch {
    /* ignore */
  }
  return null
}

/** 子应用校验来自父页的 message.origin */
export function isTrustedParentOrigin(
  eventOrigin: string,
  trustedParentOrigin: string | null,
  allowAnyInDev = true,
): boolean {
  if (!trustedParentOrigin) {
    if (allowAnyInDev && import.meta.env.DEV)
      return true
    // 未能解析父 origin 时保持可用，避免误杀；生产请显式配置 trustedParentOrigin
    return true
  }
  return eventOrigin === trustedParentOrigin
}


export function createIframeMessage<T extends IframeMessageType>(
  type: T,
  extra: Omit<IframeBridgeEnvelope<T>, 'source' | 'type'> = {},
): IframeBridgeEnvelope<T> {
  return {
    source: IFRAME_BRIDGE_SOURCE,
    type,
    ...extra,
  }
}

/** 子应用向主应用上报面包屑（第三方也可直接调用） */
export function postIframeBreadcrumb(items: string[], targetOrigin = '*') {
  if (typeof window === 'undefined' || !window.parent || window.parent === window)
    return
  window.parent.postMessage(
    createIframeMessage('breadcrumb', { data: items }),
    targetOrigin,
  )
}

/** 子应用主动上报就绪（通常由 setupIframeChildBridge 自动发送） */
export function postIframeReady(targetOrigin = '*') {
  if (typeof window === 'undefined' || !window.parent || window.parent === window)
    return
  window.parent.postMessage(createIframeMessage('ready'), targetOrigin)
}

/** 子应用上报路由变化 */
export function postIframeRouteChange(path: string, targetOrigin = '*') {
  if (typeof window === 'undefined' || !window.parent || window.parent === window)
    return
  window.parent.postMessage(
    createIframeMessage('route-change', { path }),
    targetOrigin,
  )
}

/** 子应用上报内容高度 */
export function postIframeResize(height?: number, targetOrigin = '*') {
  if (typeof window === 'undefined' || !window.parent || window.parent === window)
    return
  const h = height ?? Math.max(
    document.documentElement?.scrollHeight || 0,
    document.body?.scrollHeight || 0,
  )
  if (h > 0)
    window.parent.postMessage(createIframeMessage('iframe-resize', { height: h }), targetOrigin)
}

export function isIframeBridgeMessage(data: unknown): data is IframeBridgeEnvelope {
  if (!data || typeof data !== 'object')
    return false
  const msg = data as Record<string, unknown>
  return msg.source === IFRAME_BRIDGE_SOURCE && typeof msg.type === 'string'
}

/** 从 iFrameUrl 解析可信任 origin；无效则返回 null */
export function resolveIframeOrigin(iframeUrl: string): string | null {
  try {
    return new URL(iframeUrl, window.location.href).origin
  }
  catch {
    return null
  }
}

/** 校验 message 来源是否匹配 iframe 配置 origin（'*' 仅开发兜底，生产应配置完整 URL） */
export function isTrustedIframeOrigin(
  eventOrigin: string,
  iframeUrl: string,
  allowAny = false,
): boolean {
  if (allowAny)
    return true
  const expected = resolveIframeOrigin(iframeUrl)
  if (!expected)
    return false
  return eventOrigin === expected
}

/** 规范化子路径：保证以 / 开头，去掉末尾多余 /（根路径除外） */
export function normalizeChildPath(path: string | undefined | null): string {
  if (!path || path === '/')
    return '/'
  let next = path.trim()
  if (!next.startsWith('/'))
    next = `/${next}`
  // 去掉 query/hash 以外的重复斜杠
  const [pathname, rest = ''] = next.split(/([?#].*)/)
  const cleaned = pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
  return `${cleaned}${rest}`
}

/**
 * 拼接 iframe 实际地址：base + childPath
 * - base 已含 path 时按「目录」拼接（去掉末尾 /）
 * - childPath 的 query/hash 保留
 */
export function joinIframeSrc(baseUrl: string, childPath = '/'): string {
  const child = normalizeChildPath(childPath)
  try {
    const url = new URL(baseUrl, window.location.href)
    if (child === '/')
      return url.href

    const [pathname, searchHash = ''] = child.split(/([?#].*)/)
    const basePath = url.pathname.replace(/\/$/, '')
    url.pathname = `${basePath}${pathname}`.replace(/\/{2,}/g, '/')
    if (searchHash.startsWith('?') || searchHash.startsWith('#')) {
      const qIndex = searchHash.indexOf('?')
      const hIndex = searchHash.indexOf('#')
      if (qIndex === 0) {
        const hashPart = hIndex > 0 ? searchHash.slice(hIndex) : ''
        const queryPart = hIndex > 0 ? searchHash.slice(1, hIndex) : searchHash.slice(1)
        url.search = queryPart
        url.hash = hashPart
      }
      else if (hIndex === 0) {
        url.hash = searchHash
      }
    }
    return url.href
  }
  catch {
    const base = baseUrl.replace(/\/$/, '')
    return child === '/' ? base : `${base}${child}`
  }
}

/** 从主应用路由 params 解析子路径（配合 :iframePath(.*)*） */
export function childPathFromRouteParams(
  iframePath: string | string[] | undefined | null,
): string {
  if (iframePath == null || iframePath === '')
    return '/'
  if (Array.isArray(iframePath))
    return normalizeChildPath(`/${iframePath.filter(Boolean).join('/')}`)
  return normalizeChildPath(`/${iframePath}`)
}

/** 主应用 basePath + 子路径 → 主应用完整 path（仅 pathname） */
export function toHostPath(basePath: string, childPath: string): string {
  const base = (basePath || '/').replace(/\/$/, '') || ''
  const child = normalizeChildPath(childPath)
  if (child === '/')
    return base || '/'
  const pathname = child.split(/[?#]/)[0]
  return `${base}${pathname}`
}

/** 从主应用完整 path 反解子路径 */
export function toChildPath(fullPath: string, basePath: string): string {
  const base = (basePath || '/').replace(/\/$/, '') || ''
  const full = fullPath.split(/[?#]/)[0]
  if (!base || full === base)
    return '/'
  if (full.startsWith(`${base}/`))
    return normalizeChildPath(full.slice(base.length))
  return '/'
}

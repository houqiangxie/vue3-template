import {
  IFRAME_BRIDGE_INSTALLED_KEY,
  IFRAME_BRIDGE_SOURCE,
  type IframeBridgeWindowFlags,
} from './types'
import bridgeSource from '../../../public/iframe-bridge.js?raw'

export interface InjectChildBridgeOptions {
  /** 子 → 父 postMessage targetOrigin，默认 '*' */
  targetOrigin?: string
  /**
   * 子应用校验父消息用的 origin（写入 __IFRAME_BRIDGE__）。
   * 默认注入方会传 window.location.origin。
   */
  trustedParentOrigin?: string
  syncRoute?: boolean
  syncHeight?: boolean
  syncBreadcrumb?: boolean
  /** 子应用 localStorage 中 token 的 key，默认 token */
  tokenStorageKey?: string
  /**
   * 可选：改为外链脚本（默认内联 public/iframe-bridge.js，更稳）。
   * 跨域子应用自行引入时用：`${origin}${BASE_URL}iframe-bridge.js`
   */
  scriptUrl?: string
}

/**
 * 判断 iframe 是否可同源访问（可注入脚本）
 */
export function canAccessIframeDocument(iframe: HTMLIFrameElement | null | undefined): boolean {
  if (!iframe)
    return false
  try {
    const doc = iframe.contentDocument
    return !!(doc && doc.documentElement)
  }
  catch {
    return false
  }
}

/**
 * 主应用向同源 iframe 注入桥接脚本。
 * 跨域会返回 false；若子页已装 Vue 桥（同 FLAG）则跳过，避免双桥。
 */
export function injectChildBridge(
  iframe: HTMLIFrameElement | null | undefined,
  options: InjectChildBridgeOptions = {},
): boolean {
  if (!iframe || !canAccessIframeDocument(iframe))
    return false

  const doc = iframe.contentDocument
  const win = iframe.contentWindow as (Window & IframeBridgeWindowFlags) | null
  if (!doc || !win)
    return false

  // Vue 桥或脚本桥已装：直接视为成功，不再二次注入
  if (win[IFRAME_BRIDGE_INSTALLED_KEY])
    return true

  try {
    win.__IFRAME_BRIDGE__ = {
      source: IFRAME_BRIDGE_SOURCE,
      targetOrigin: options.targetOrigin || '*',
      trustedParentOrigin: options.trustedParentOrigin || window.location.origin,
      syncRoute: options.syncRoute !== false,
      syncHeight: options.syncHeight !== false,
      syncBreadcrumb: options.syncBreadcrumb !== false,
      tokenStorageKey: options.tokenStorageKey || 'token',
    }

    const existed = doc.querySelector('script[data-iframe-bridge="1"]')
    if (existed)
      return true

    const script = doc.createElement('script')
    script.dataset.iframeBridge = '1'
    if (options.scriptUrl) {
      script.src = options.scriptUrl
      script.async = true
    }
    else {
      // 内联注入：不依赖子页能否请求到主应用静态资源
      script.textContent = bridgeSource
    }
    ;(doc.head || doc.documentElement).appendChild(script)
    return true
  }
  catch (err) {
    console.warn('[iframeBridge] 同源注入失败（可能跨域）', err)
    return false
  }
}

/** 跨域子应用可自行引入的脚本绝对地址 */
export function getIframeBridgeScriptUrl(): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  return new URL(`${base}iframe-bridge.js`, window.location.href).href
}

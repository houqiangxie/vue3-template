/** postMessage 协议标识，避免与第三方消息混淆 */
export const IFRAME_BRIDGE_SOURCE = 'vue3-template-iframe' as const

/** 全局安装标记：Vue 桥与 script 桥互斥，避免同源双装 */
export const IFRAME_BRIDGE_INSTALLED_KEY = '__IFRAME_BRIDGE_INSTALLED__' as const
export const IFRAME_BRIDGE_KIND_KEY = '__IFRAME_BRIDGE_KIND__' as const

export type IframeBridgeKind = 'vue' | 'script'

/** 子 → 主 */
export type IframeChildMessageType =
  | 'ready'
  | 'route-change'
  | 'iframe-resize'
  | 'breadcrumb'

/** 主 → 子 */
export type IframeHostMessageType =
  | 'navigate'
  | 'auth-token'
  | 'ping'

export type IframeMessageType = IframeChildMessageType | IframeHostMessageType

export interface IframeBridgeEnvelope<T extends IframeMessageType = IframeMessageType> {
  source: typeof IFRAME_BRIDGE_SOURCE
  type: T
  /** 子应用路由 fullPath（route-change / navigate） */
  path?: string
  /** 内容高度 px（iframe-resize） */
  height?: number
  /** 面包屑文案（breadcrumb） */
  data?: string[]
  /** 登录凭证（auth-token） */
  token?: string
  /** 可选扩展字段 */
  payload?: Record<string, unknown>
}

export type IframeReadyMessage = IframeBridgeEnvelope<'ready'>
export type IframeRouteChangeMessage = IframeBridgeEnvelope<'route-change'> & { path: string }
export type IframeResizeMessage = IframeBridgeEnvelope<'iframe-resize'> & { height: number }
export type IframeBreadcrumbMessage = IframeBridgeEnvelope<'breadcrumb'> & { data: string[] }
export type IframeNavigateMessage = IframeBridgeEnvelope<'navigate'> & { path: string }
export type IframeAuthTokenMessage = IframeBridgeEnvelope<'auth-token'> & { token: string }
export type IframePingMessage = IframeBridgeEnvelope<'ping'>

export interface IframeBridgeWindowFlags {
  [IFRAME_BRIDGE_INSTALLED_KEY]?: boolean
  [IFRAME_BRIDGE_KIND_KEY]?: IframeBridgeKind
  __IFRAME_BRIDGE__?: Record<string, unknown>
  __iframeBridge?: {
    postBreadcrumb: (items: string[]) => void
    postRoute: () => void
    postResize: () => void
  }
}

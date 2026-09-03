import { onMounted, onUnmounted } from 'vue'
import type { Router } from 'vue-router'
import { local } from 'ux-web-storage'
import {
  createIframeMessage,
  isIframeBridgeInstalled,
  isIframeBridgeMessage,
  isTrustedParentOrigin,
  markIframeBridgeInstalled,
  normalizeChildPath,
  postIframeBreadcrumb,
  resolveTrustedParentOrigin,
  unmarkIframeBridgeInstalled,
} from '@/utils/iframeBridge'

export {
  postIframeBreadcrumb,
  postIframeReady,
  postIframeRouteChange,
  postIframeResize,
} from '@/utils/iframeBridge'

export interface UseIframeChildOptions {
  /** 是否上报路由变化，默认 true */
  syncRoute?: boolean
  /** 是否上报内容高度，默认 true */
  syncHeight?: boolean
  /** 是否根据 matched.meta.title 自动上报面包屑，默认 true */
  syncBreadcrumb?: boolean
  /** ResizeObserver / 窗口变化防抖 ms */
  resizeDebounceMs?: number
  /** postMessage targetOrigin，默认 '*'（子应用通常不知父 origin；生产建议配置） */
  targetOrigin?: string
  /**
   * 校验父页 message.origin；默认从 targetOrigin / ancestorOrigins / referrer 推断。
   * 传 '*' 表示不校验。
   */
  trustedParentOrigin?: string
  /** 开发环境未解析到父 origin 时是否放行，默认 true */
  allowAnyOriginInDev?: boolean
}

function isEmbedded(): boolean {
  try {
    return window.self !== window.top
  }
  catch {
    return true
  }
}

function collectBreadcrumbTitles(router: Router): string[] {
  return router.currentRoute.value.matched
    .filter(r => r.meta?.title && r.meta?.breadcrumb !== false && r.name !== 'Layout')
    .map(r => String(r.meta.title))
}

function noopApi() {
  return {
    dispose: () => {},
    postBreadcrumb: (_items: string[]) => {},
    postResize: () => {},
  }
}

/**
 * 安装子应用桥：返回 { dispose, postBreadcrumb, postResize }。
 * useIframeChild / setupIframeChildBridge 共用。
 * 若 script 桥已装则跳过，避免同源双桥。
 */
function installIframeChildBridge(router: Router, options: UseIframeChildOptions = {}) {
  if (isIframeBridgeInstalled())
    return noopApi()

  if (!markIframeBridgeInstalled('vue'))
    return noopApi()

  const {
    syncRoute = true,
    syncHeight = true,
    syncBreadcrumb = true,
    resizeDebounceMs = 100,
    targetOrigin = '*',
    allowAnyOriginInDev = true,
  } = options

  const trustedParent = resolveTrustedParentOrigin({
    trustedParentOrigin: options.trustedParentOrigin,
    targetOrigin,
  })

  let disposed = false
  let syncingFromHost = false
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  let removeAfterEach: (() => void) | undefined
  let resizeObserver: ResizeObserver | null = null

  function post(
    type: 'ready' | 'route-change' | 'iframe-resize' | 'breadcrumb',
    extra: Record<string, unknown> = {},
  ) {
    if (disposed)
      return
    window.parent.postMessage(createIframeMessage(type, extra), targetOrigin)
  }

  function postBreadcrumb(items: string[]) {
    if (disposed)
      return
    postIframeBreadcrumb(items, targetOrigin)
  }

  function reportAutoBreadcrumb() {
    if (!syncBreadcrumb)
      return
    const crumbs = collectBreadcrumbTitles(router)
    if (crumbs.length)
      postBreadcrumb(crumbs)
  }

  function postResize() {
    if (!syncHeight)
      return
    const height = Math.max(
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0,
    )
    if (height > 0)
      post('iframe-resize', { height })
  }

  function scheduleResize() {
    if (resizeTimer)
      clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      resizeTimer = null
      postResize()
    }, resizeDebounceMs)
  }

  /** 响应宿主 ping / 切回 keep-alive：重报当前态 */
  function reportSnapshot() {
    if (syncRoute)
      post('route-change', { path: router.currentRoute.value.fullPath })
    reportAutoBreadcrumb()
    postResize()
  }

  function onMessage(event: MessageEvent) {
    if (disposed || !isIframeBridgeMessage(event.data))
      return
    if (!isTrustedParentOrigin(event.origin, trustedParent, allowAnyOriginInDev))
      return

    const msg = event.data
    if (msg.type === 'ping') {
      reportSnapshot()
      return
    }

    if (msg.type === 'auth-token' && typeof msg.token === 'string' && msg.token) {
      const storage = local as { token?: { token?: string } }
      storage.token = {
        ...(storage.token || {}),
        token: msg.token,
      }
      return
    }

    if (msg.type === 'navigate' && syncRoute && typeof msg.path === 'string') {
      const path = normalizeChildPath(msg.path)
      if (path === router.currentRoute.value.fullPath)
        return
      syncingFromHost = true
      router.push(path).finally(() => {
        syncingFromHost = false
      })
    }
  }

  window.addEventListener('message', onMessage)

  if (syncRoute || syncBreadcrumb) {
    removeAfterEach = router.afterEach((to) => {
      if (syncingFromHost)
        return
      if (syncRoute)
        post('route-change', { path: to.fullPath })
      reportAutoBreadcrumb()
    })
  }

  if (syncHeight) {
    window.addEventListener('resize', scheduleResize)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => scheduleResize())
      resizeObserver.observe(document.documentElement)
    }
    scheduleResize()
  }

  post('ready')
  reportSnapshot()

  function dispose() {
    if (disposed)
      return
    disposed = true
    window.removeEventListener('message', onMessage)
    window.removeEventListener('resize', scheduleResize)
    removeAfterEach?.()
    resizeObserver?.disconnect()
    if (resizeTimer)
      clearTimeout(resizeTimer)
    unmarkIframeBridgeInstalled('vue')
  }

  return { dispose, postBreadcrumb, postResize }
}

/**
 * 子应用侧 composable：在 iframe 内同步路由 / 高度 / 面包屑，并接收主应用 token 与导航。
 */
export function useIframeChild(router: Router, options: UseIframeChildOptions = {}) {
  if (!isEmbedded()) {
    return {
      enabled: false as const,
      postBreadcrumb: (_items: string[]) => {},
      postResize: () => {},
      dispose: () => {},
    }
  }

  let api: ReturnType<typeof installIframeChildBridge> | null = null

  onMounted(() => {
    api = installIframeChildBridge(router, options)
  })
  onUnmounted(() => {
    api?.dispose()
    api = null
  })

  return {
    enabled: true as const,
    postBreadcrumb: (items: string[]) => api?.postBreadcrumb(items),
    postResize: () => api?.postResize(),
    dispose: () => api?.dispose(),
  }
}

/**
 * 非组件上下文安装（permission / bootstrap）：返回 dispose。
 */
export function setupIframeChildBridge(router: Router, options: UseIframeChildOptions = {}) {
  if (!isEmbedded())
    return () => {}
  return installIframeChildBridge(router, options).dispose
}

import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { local } from 'ux-web-storage'
import { useIframeStore } from '@/store/iframe'
import {
  childPathFromRouteParams,
  createIframeMessage,
  injectChildBridge,
  isIframeBridgeMessage,
  isTrustedIframeOrigin,
  joinIframeSrc,
  normalizeChildPath,
  resolveIframeOrigin,
  toChildPath,
  toHostPath,
} from '@/utils/iframeBridge'

export interface UseIframeHostOptions {
  /** 是否在子应用 ready 时下发 token，默认 true */
  syncAuth?: boolean
  /** 是否根据 iframe-resize 调整高度，默认 true */
  syncHeight?: boolean
  /** 是否同步路由，默认 true */
  syncRoute?: boolean
  /**
   * 同源时是否自动注入 public/iframe-bridge.js（默认 true）。
   * 跨域无法注入，需子应用自行引入该脚本或手写 postMessage。
   * 子页若已装 Vue 桥会跳过注入，避免双桥。
   */
  injectBridge?: boolean
  /**
   * 开发环境是否放宽 origin 校验（默认 true）。
   * 生产始终按 iFrameUrl 的 origin 严格校验。
   */
  allowAnyOriginInDev?: boolean
}

/**
 * 主应用 iframe 宿主：监听子应用 postMessage，同步路由 / 高度 / 面包屑，并下发 token、反向导航。
 */
export function useIframeHost(options: UseIframeHostOptions = {}) {
  const {
    syncAuth = true,
    syncHeight = true,
    syncRoute = true,
    injectBridge = true,
    allowAnyOriginInDev = true,
  } = options

  const route = useRoute()
  const router = useRouter()
  const iframeStore = useIframeStore()

  const iframeRef = shallowRef<HTMLIFrameElement | null>(null)
  const frameHeight = ref<number | null>(null)
  const loaded = ref(false)

  /** 防止 host ↔ child 互相推路由死循环 */
  let syncingFromChild = false
  let syncingFromHost = false
  let active = true

  const baseUrl = computed(() => String(route.meta?.iFrameUrl || ''))
  const basePath = computed(() => {
    const metaBase = route.meta?.iFrameBasePath
    if (typeof metaBase === 'string' && metaBase)
      return metaBase.replace(/\/$/, '') || '/'
    // 有 catch-all 参数时，从完整 path 剥离子路径
    const fromParams = childPathFromRouteParams(
      route.params.iframePath as string | string[] | undefined,
    )
    if (fromParams !== '/') {
      const full = route.path.replace(/\/$/, '') || '/'
      const suffix = fromParams.replace(/\/$/, '') || ''
      if (suffix && full.endsWith(suffix))
        return full.slice(0, full.length - suffix.length).replace(/\/$/, '') || '/'
    }
    return route.path.replace(/\/$/, '') || '/'
  })

  const childPath = computed(() => {
    const fromParams = childPathFromRouteParams(
      route.params.iframePath as string | string[] | undefined,
    )
    if (route.params.iframePath != null && route.params.iframePath !== '')
      return fromParams
    return toChildPath(route.path, String(route.meta?.iFrameBasePath || basePath.value))
  })

  /**
   * src 仅随 baseUrl（及首次进入时的 childPath）变化；
   * 之后子路由只走 postMessage，避免改 src 导致整页重载。
   */
  const iframeSrc = ref('')

  function rebuildSrc(withChildPath: string) {
    if (!baseUrl.value) {
      iframeSrc.value = ''
      return
    }
    iframeSrc.value = joinIframeSrc(baseUrl.value, withChildPath)
  }

  const targetOrigin = computed(() => resolveIframeOrigin(baseUrl.value) || '*')

  function postToChild(type: 'navigate' | 'auth-token' | 'ping', extra: Record<string, unknown> = {}) {
    const win = iframeRef.value?.contentWindow
    if (!win || !loaded.value)
      return
    win.postMessage(createIframeMessage(type, extra), targetOrigin.value)
  }

  function sendAuthToken() {
    if (!syncAuth)
      return
    const token = (local as { token?: { token?: string } }).token?.token
    if (!token)
      return
    postToChild('auth-token', { token })
  }

  function navigateChild(path: string) {
    if (!syncRoute)
      return
    syncingFromHost = true
    postToChild('navigate', { path: normalizeChildPath(path) })
    queueMicrotask(() => {
      syncingFromHost = false
    })
  }

  /** keep-alive 切回：请求子应用重报路由 / 面包屑 / 高度 */
  function pingChild() {
    postToChild('ping')
  }

  function syncHostRoute(childFullPath: string) {
    if (!syncRoute || syncingFromHost)
      return
    const nextPath = toHostPath(basePath.value, childFullPath)
    if (nextPath === route.path)
      return
    syncingFromChild = true
    router.push(nextPath).finally(() => {
      syncingFromChild = false
    })
  }

  function onMessage(event: MessageEvent) {
    if (!active || !isIframeBridgeMessage(event.data))
      return

    // 开发态可放宽 origin；生产按 iFrameUrl 严格校验
    const allowAny = allowAnyOriginInDev && import.meta.env.DEV
    if (baseUrl.value && !isTrustedIframeOrigin(event.origin, baseUrl.value, allowAny))
      return

    const msg = event.data
    switch (msg.type) {
      case 'ready':
        loaded.value = true
        sendAuthToken()
        // 就绪后对齐一次当前子路径
        if (childPath.value && childPath.value !== '/')
          navigateChild(childPath.value)
        break
      case 'route-change':
        if (typeof msg.path === 'string')
          syncHostRoute(msg.path)
        break
      case 'iframe-resize':
        if (syncHeight && typeof msg.height === 'number' && msg.height > 0)
          frameHeight.value = msg.height
        break
      case 'breadcrumb':
        if (Array.isArray(msg.data)) {
          iframeStore.setBreadcrumbs(
            msg.data.filter((x): x is string => typeof x === 'string'),
            route.name ? String(route.name) : undefined,
          )
        }
        break
      default:
        break
    }
  }

  function onIframeLoad() {
    loaded.value = true
    // 同源：主应用注入桥接脚本；子页已装 Vue 桥则 inject 内部跳过
    if (injectBridge) {
      const ok = injectChildBridge(iframeRef.value, {
        targetOrigin: '*',
        trustedParentOrigin: window.location.origin,
        syncRoute,
        syncHeight,
        syncBreadcrumb: true,
      })
      if (!ok && import.meta.env.DEV) {
        console.info(
          '[iframeBridge] 跨域无法注入，请让子应用引入 /iframe-bridge.js，或自行 postMessage',
        )
      }
    }
    // 部分子应用不发 ready，load 后仍尝试下发 token
    sendAuthToken()
  }

  watch(childPath, (path, prev) => {
    if (!active || syncingFromChild || path === prev)
      return
    if (!loaded.value)
      return
    navigateChild(path)
  })

  watch(baseUrl, (url, prev) => {
    frameHeight.value = null
    loaded.value = false
    // base 变化或首次：用当前子路径重建 src
    if (url && url !== prev)
      rebuildSrc(childPath.value)
    else if (!url)
      iframeSrc.value = ''
  }, { immediate: true })

  onMounted(() => {
    active = true
    window.addEventListener('message', onMessage)
  })

  onUnmounted(() => {
    active = false
    window.removeEventListener('message', onMessage)
    iframeStore.clearBreadcrumbs(route.name ? String(route.name) : undefined)
  })

  onActivated(() => {
    active = true
    if (loaded.value) {
      pingChild()
      sendAuthToken()
      if (syncRoute && childPath.value && childPath.value !== '/')
        navigateChild(childPath.value)
    }
  })

  onDeactivated(() => {
    active = false
    iframeStore.clearBreadcrumbs(route.name ? String(route.name) : undefined)
  })

  const iframeStyle = computed(() => {
    if (frameHeight.value == null)
      return undefined
    return { height: `${frameHeight.value}px` }
  })

  return {
    iframeRef,
    iframeSrc,
    iframeStyle,
    frameHeight,
    loaded,
    baseUrl,
    basePath,
    childPath,
    onIframeLoad,
    sendAuthToken,
    navigateChild,
    pingChild,
  }
}

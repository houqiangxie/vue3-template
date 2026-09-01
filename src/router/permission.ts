import { local } from 'ux-web-storage'
import type { ViewModules } from '@/router/utils/buildDynamicRoutes'
import type { Router } from 'vue-router'

/**
 * 安装全局导航守卫：
 *  1. 顶部进度条（路由切换）
 *  2. 保持 "isIframe" 标志同步
 *  3. 将未认证用户重定向到 /login
 *  4. 在第一次认证导航时，调用 `permissionStore.setupRoutes()`
 *     根据后台菜单动态添加路由，然后重新触发导航
 */
export default (router: Router, viewModules: ViewModules, viewsBaseDir: string): void => {
  router.beforeEach(async (to, from) => {
    const loadingStore = useLoadingStore()
    if (to.fullPath !== from.fullPath)
      loadingStore.setNavigating(true)

    // 兼容旧版 /redirect/... 刷新地址（hash / history 均适用）
    if (to.path === '/redirect' || to.path.startsWith('/redirect/')) {
      let target = to.path.slice('/redirect'.length) || '/'
      while (target.startsWith('/redirect/') || target === '/redirect') {
        target = target === '/redirect' ? '/' : target.slice('/redirect'.length)
      }
      if (!target.startsWith('/'))
        target = `/${target}`
      return { path: target, query: to.query, hash: to.hash, replace: true }
    }

    // iframe 嵌入只用显式标记；勿依赖 query.token（易进日志/Referer）
    loadingStore.isIframe = to.query.isIframe === '1' || to.query.isIframe === 'true' || to.query.isIframe === ''

    // ?token= 仅 DEV 或显式 VITE_ALLOW_QUERY_TOKEN=true 时写入本地；生产默认忽略并剥离 query
    // 新嵌入请用 postMessage / 首屏注入等方式传凭证，勿再依赖 URL 凭证
    if (typeof to.query.token === 'string' && to.query.token) {
      const allowQueryToken = import.meta.env.DEV
        || import.meta.env.VITE_ALLOW_QUERY_TOKEN === 'true'
        || import.meta.env.VITE_ALLOW_QUERY_TOKEN === '1'
      const nextQuery = { ...to.query }
      if (to.query.isIframe != null)
        nextQuery.isIframe = to.query.isIframe || '1'
      delete nextQuery.token

      if (allowQueryToken) {
        const storage = local as { token?: { token?: string } }
        if (!storage.token?.token)
          storage.token = { token: to.query.token }
      }
      else {
        console.warn('[permission] 已忽略 URL query.token（生产默认关闭，需设 VITE_ALLOW_QUERY_TOKEN=true）')
      }
      return { path: to.path, query: nextQuery, hash: to.hash, replace: true }
    }

    const token = (local as any).token?.token as string | undefined
    const permissionStore = usePermissionStore()
    const routeName = String(to.name ?? '')

    // 错误页始终可访问（无需登录）
    const errorRouteNames = new Set(['Error403', 'Error404', 'Error500'])
    if (errorRouteNames.has(routeName))
      return true

    // 已登录访问登录页 → 跳默认首页
    if (routeName === 'Login') {
      if (!token)
        return true

      if (!permissionStore.routesLoaded)
        await permissionStore.setupRoutes(router, viewModules, viewsBaseDir)

      const homeName = permissionStore.defaultRouteName
      if (homeName)
        return { name: homeName, replace: true }

      return { path: '/', replace: true }
    }

    if (!token)
      return `/login?returnUrl=${encodeURIComponent(to.fullPath)}`

    if (!permissionStore.routesLoaded) {
      try {
        await permissionStore.setupRoutes(router, viewModules, viewsBaseDir)
        // 动态路由刚注册完，必须重新匹配；访问根路径时直达默认首页
        if (to.path === '/' && permissionStore.defaultRouteName) {
          return { name: permissionStore.defaultRouteName, replace: true }
        }
        return {
          path: to.path,
          query: to.query,
          hash: to.hash,
          replace: true,
        }
      }
      catch (error) {
        console.error('Failed to setup routes:', error)
        return '/login'
      }
    }

    return true
  })

  router.afterEach(() => {
    useLoadingStore().setNavigating(false)
  })

  router.onError(() => {
    useLoadingStore().setNavigating(false)
  })
}

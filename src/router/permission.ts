import { local } from 'ux-web-storage'
import { useCommonStore } from '@/store/common'
import { usePermissionStore } from '@/store/modules/permission'
import type { Router } from 'vue-router'
import type { RoutePoolItem } from './utils/types'

/**
 * 安装全局导航守卫：
 *  1. 保持 "isIframe" 标志同步
 *  2. 将未认证用户重定向到 /login
 *  3. 在第一次认证导航时，调用 `permissionStore.setupRoutes()`
 *     动态添加权限路由，然后重新触发导航以便新注册的路由能正确匹配
 *
 * @param router Vue Router 实例
 * @param routePool 路由池（所有文件生成的路由）
 */
export default (router: Router, routePool: RoutePoolItem[]): void => {
  router.beforeEach(async (to, from, next) => {
    const commonStore = useCommonStore()
    commonStore.isIframe = !!(to.query.token || to.query.isIframe)

    const token = (local as any).token?.token||1
    const permissionStore = usePermissionStore()

    // ── 已认证 — 首次导航：优先加载动态路由 ──────────────────────────────────────
    if (token && !permissionStore.routesLoaded && to.name !== 'Login') {
      try {
        await permissionStore.setupRoutes(router, routePool)
        
        // 如果当前匹配的是静态通配符，说明需要重新匹配动态路由
        if (to.name === 'StaticCatchAll' || !to.name) {
          // 必须通过 fullPath 字符串进行跳转，强制路由器重新进行路径匹配
          // 否则如果携带 to.name，路由器会再次匹配到 StaticCatchAll
          return next({ 
            path: to.path, 
            query: to.query, 
            hash: to.hash, 
            replace: true 
          })
        }
        
        // 已经匹配到具体的路由名，直接放行
        return next()
      }
      catch (error) {
        console.error('Failed to setup routes:', error)
        return next('/login')
      }
    }

    // ── /login ────────────────────────────────────────────────────────────────
    if (to.name === 'Login') {
      if (token) {
        // 已认证且访问登录页：跳转到首页
        if (!permissionStore.routesLoaded) {
          await permissionStore.setupRoutes(router, routePool)
        }
        return next({ name: 'Index-Home-HomeIndex', replace: true })
      }
      return next()
    }

    // ── 未认证 ────────────────────────────────────────────────────────────────
    if (!token) {
      return next(`/login?returnUrl=${encodeURIComponent(to.fullPath)}`)
    }

    // ── 正常导航 ──────────────────────────────────────────────────────────────
    next()
  })
}

import type { Router } from 'vue-router'
import { setupIframeChildBridge } from '@/hooks/useIframeChild'
import { SUPER_PERMISSION, SUPER_ROLE, usePermissionStore } from '@/store/permission'

function detectIframe(query: Record<string, unknown>): boolean {
  if (query.isIframe === '1' || query.isIframe === 'true' || query.isIframe === '')
    return true
  try {
    return window.self !== window.top
  }
  catch {
    return true
  }
}

/** 独立站无登录：注入超级权限，使分类/表单等 CRUD 按钮可见 */
function ensureBpmPermissions() {
  const permissionStore = usePermissionStore()
  if (!permissionStore.userPermissions.length) {
    permissionStore.userPermissions = [SUPER_PERMISSION]
    permissionStore.userRoles = [SUPER_ROLE]
  }
}

/**
 * BPM 独立站：同步嵌入态 + 子应用桥（无登录动态路由）。
 * 菜单显隐由 BpmLayout 根据 isIframe / query.hideMenu / meta.hideMenu 裁剪。
 */
export function setupBpmPermission(router: Router) {
  let disposeIframeChild: (() => void) | undefined

  router.beforeEach((to) => {
    // pinia 已在 createBootstrap 中挂载后再走守卫
    ensureBpmPermissions()

    const loadingStore = useLoadingStore()
    const embedded = detectIframe(to.query as Record<string, unknown>)
    loadingStore.isIframe = embedded

    if (!disposeIframeChild && embedded)
      disposeIframeChild = setupIframeChildBridge(router)

    return true
  })
}

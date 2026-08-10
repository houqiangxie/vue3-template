import type { Router } from 'vue-router'

import { getInfo, getRouters } from '@/api/system/auth'
import { menusToMenuOptions } from '@/config/menu/menuFromRoutes'
import { useMenuStore } from '@/store/modules/menu'
import { useTabsViewStore } from '@/store/modules/tabsView'

import {
  buildDynamicRoutes,
  filterMenusByAvailableViews,
  getDefaultRouteName,
  normalizeMenusForLayout,
  prepareSidebarMenus,
  type ViewModules,
} from '@/router/utils/buildDynamicRoutes'

import type { MenuItem } from '@/router/utils/types'

/**
 * 权限管理 Store（对齐若依 / guanweb）
 *
 * 核心流程：
 * 1. 用户登录后从后台获取菜单配置
 * 2. 侧栏使用完整菜单树（含 ParentView 目录）
 * 3. 注册路由时扁平化 ParentView/Layout，挂到常量 Layout 下
 * 4. 切换账号时清空路由和缓存
 */
export const usePermissionStore = defineStore('permission', () => {
  /** 是否已加载动态路由 */
  const routesLoaded = ref(false)

  /** 动态添加的顶级路由名称列表（用于退出时清理） */
  const addedRouteNames = ref<string[]>([])

  /** 用户权限列表 */
  const userPermissions = ref<string[]>([])

  /** 用户菜单列表（后台返回，权限过滤后） */
  const userMenuList = ref<MenuItem[]>([])

  /** 默认首页路由名称 */
  const defaultRouteName = ref<string>()

  /**
   * 从后台获取用户菜单和权限
   */
  async function fetchUserMenuAndPermissions(): Promise<{
    menus: MenuItem[]
    permissions: string[]
  }> {
    const [menusRes, infoRes] = await Promise.all([
      getRouters(),
      getInfo(),
    ])

    return {
      menus: menusRes.data ?? [],
      permissions: infoRes.data?.permissions ?? [],
    }
  }

  function setPermissions(permissions: string[]) {
    userPermissions.value = permissions
  }

  function setMenus(menus: MenuItem[]) {
    userMenuList.value = menus
  }

  function syncSidebarMenus(menus: MenuItem[]) {
    const sidebarMenus = prepareSidebarMenus(menus)
    useMenuStore().setMenuOptions(menusToMenuOptions(sidebarMenus))
  }

  /**
   * 获取用户权限并动态设置路由
   *
   * @param router 路由器实例
   * @param viewModules import.meta.glob 扫描到的视图组件
   * @param viewsBaseDir 视图根目录，如 '/src/views/web/'
   */
  async function setupRoutes(
    router: Router,
    viewModules: ViewModules,
    viewsBaseDir: string,
  ): Promise<void> {
    if (routesLoaded.value)
      return

    try {
      const { menus, permissions } = await fetchUserMenuAndPermissions()

      userPermissions.value = permissions

      const filteredMenus = filterMenusByAvailableViews(
        filterMenuByPermission(menus, permissions),
        viewModules,
        viewsBaseDir,
      )
      const layoutMenus = normalizeMenusForLayout(prepareSidebarMenus(filteredMenus))
      userMenuList.value = layoutMenus
      defaultRouteName.value = getDefaultRouteName(layoutMenus)

      // 侧栏：保留目录树；路由：ParentView/Layout 扁平化
      syncSidebarMenus(layoutMenus)

      const routes = buildDynamicRoutes(viewModules, viewsBaseDir, layoutMenus)

      const names: string[] = []
      routes.forEach((route) => {
        if (route.name && router.hasRoute(route.name))
          return

        router.addRoute('Layout', route)

        if (route.name)
          names.push(String(route.name))
      })

      if (defaultRouteName.value && !router.hasRoute('LayoutRedirect')) {
        router.addRoute('Layout', {
          path: '',
          name: 'LayoutRedirect',
          redirect: { name: defaultRouteName.value },
        })
        names.push('LayoutRedirect')
      }

      const catchAllRouteName = 'CatchAll'
      if (!router.hasRoute(catchAllRouteName)) {
        router.addRoute({
          path: '/:pathMatch(.*)*',
          name: catchAllRouteName,
          redirect: '/',
        })
      }

      addedRouteNames.value = names
      routesLoaded.value = true
    }
    catch (error) {
      console.error('Failed to setup routes:', error)
      throw error
    }
  }

  function hasMenuPermission(permissions: string[], required?: string[]): boolean {
    // 用户权限尚未加载或为空：fail-closed，避免未鉴权时菜单全开
    if (!permissions.length)
      return false
    // 菜单未声明 permissions：目录/公开页可见（仍受父级过滤）
    if (!required?.length)
      return true
    if (permissions.includes('*:*:*'))
      return true
    return required.some(p => permissions.includes(p))
  }

  function filterMenuByPermission(menuList: MenuItem[], permissions: string[]): MenuItem[] {
    // 权限空时整体拒绝，防止动态路由旁路
    if (!permissions.length)
      return []

    return menuList.reduce<MenuItem[]>((acc, menu) => {
      if (!hasMenuPermission(permissions, menu.meta?.permissions))
        return acc

      const children = menu.children?.length
        ? filterMenuByPermission(menu.children, permissions)
        : undefined

      // 目录节点过滤后无子菜单则丢弃，避免留下空壳路由导致白屏
      if (menu.children?.length && !children?.length)
        return acc

      acc.push({
        ...menu,
        children,
      })
      return acc
    }, [])
  }

  async function reloadRoutes(
    router: Router,
    viewModules: ViewModules,
    viewsBaseDir: string,
  ): Promise<void> {
    clearRoutes(router)
    await setupRoutes(router, viewModules, viewsBaseDir)
  }

  function clearRoutes(router: Router): void {
    addedRouteNames.value.forEach((name) => {
      if (router.hasRoute(name))
        router.removeRoute(name)
    })

    if (router.hasRoute('CatchAll'))
      router.removeRoute('CatchAll')

    addedRouteNames.value = []
    routesLoaded.value = false
    defaultRouteName.value = undefined
    useMenuStore().setMenuOptions([])
    useTabsViewStore().resetTabs()
  }

  function logout(router: Router): void {
    clearRoutes(router)
    userPermissions.value = []
    userMenuList.value = []

    try {
      localStorage.clear()
      sessionStorage.clear()
    }
    catch (e) {
      console.warn('Failed to clear storage:', e)
    }
  }

  return {
    routesLoaded,
    addedRouteNames,
    userPermissions,
    userMenuList,
    defaultRouteName,
    setPermissions,
    setMenus,
    setupRoutes,
    filterMenuByPermission,
    reloadRoutes,
    clearRoutes,
    logout,
  }
})

import type { Router } from 'vue-router'

import { getInfo, getRouters } from '@/api/system/auth'
import { menusToMenuOptions } from '@/config/menu/menuFromRoutes'

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
 * 权限管理 Store
 *
 * 核心流程：
 * 1. 用户登录后从后台获取菜单配置
 * 2. 侧栏使用完整菜单树（含 ParentView 目录；页面级菜单不展示）
 * 3. 注册路由时扁平化 ParentView/Layout，挂到常量 Layout 下
 * 4. TabView 宿主从 userMenuList 读取页面级子菜单
 * 5. 切换账号时清空路由和缓存
 */
export const usePermissionStore = defineStore('permission', () => {
  /** 是否已加载动态路由 */
  const routesLoaded = ref(false)

  /** 动态添加的顶级路由名称列表（用于退出时清理） */
  const addedRouteNames = ref<string[]>([])

  /** 用户权限列表 */
  const userPermissions = ref<string[]>([])

  /** 用户角色列表 */
  const userRoles = ref<string[]>([])

  /** 用户菜单列表（后台返回，权限过滤后；含页面级子菜单供 TabView 使用） */
  const userMenuList = ref<MenuItem[]>([])

  /** 默认首页路由名称 */
  const defaultRouteName = ref<string>()

  /** 当前入口的视图模块（TabView 动态加载子页） */
  const viewModules = shallowRef<ViewModules>({})

  /** 视图根目录，如 '/src/views/web/' */
  const viewsBaseDir = ref('')

  /**
   * 从后台获取用户菜单和权限
   */
  async function fetchUserMenuAndPermissions(): Promise<{
    menus: MenuItem[]
    permissions: string[]
    roles: string[]
  }> {
    const [menusRes, infoRes] = await Promise.all([
      getRouters(),
      getInfo(),
    ])

    return {
      menus: menusRes.data ?? [],
      permissions: infoRes.data?.permissions ?? [],
      roles: infoRes.data?.roles ?? [],
    }
  }

  function setPermissions(permissions: string[]) {
    userPermissions.value = permissions
  }

  function setRoles(roles: string[]) {
    userRoles.value = roles
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
   * @param modules import.meta.glob 扫描到的视图组件
   * @param baseDir 视图根目录，如 '/src/views/web/'
   */
  async function setupRoutes(
    router: Router,
    modules: ViewModules,
    baseDir: string,
  ): Promise<void> {
    if (routesLoaded.value)
      return

    try {
      viewModules.value = modules
      viewsBaseDir.value = baseDir

      const { menus, permissions, roles } = await fetchUserMenuAndPermissions()

      userPermissions.value = permissions
      userRoles.value = roles

      const filteredMenus = filterMenusByAvailableViews(
        filterMenuByPermission(menus, permissions),
        modules,
        baseDir,
      )
      const layoutMenus = normalizeMenusForLayout(prepareSidebarMenus(filteredMenus))
      userMenuList.value = layoutMenus
      defaultRouteName.value = getDefaultRouteName(layoutMenus)

      // 侧栏：保留目录树（页面级菜单在 menusToMenuOptions 中剔除）；路由：ParentView/Layout 扁平化
      syncSidebarMenus(layoutMenus)

      const routes = buildDynamicRoutes(modules, baseDir, layoutMenus)

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

      // 目录 / TabView 过滤后无子菜单则丢弃，避免留下空壳路由导致白屏
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
    modules: ViewModules,
    baseDir: string,
  ): Promise<void> {
    clearRoutes(router)
    await setupRoutes(router, modules, baseDir)
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
    viewModules.value = {}
    viewsBaseDir.value = ''
    useMenuStore().setMenuOptions([])
    useTabsViewStore().resetTabs()
  }

  function logout(router: Router): void {
    clearRoutes(router)
    userPermissions.value = []
    userRoles.value = []
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
    userRoles,
    userMenuList,
    defaultRouteName,
    viewModules,
    viewsBaseDir,
    setPermissions,
    setRoles,
    setMenus,
    setupRoutes,
    filterMenuByPermission,
    reloadRoutes,
    clearRoutes,
    logout,
  }
})

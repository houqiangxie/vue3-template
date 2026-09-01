import type { Router } from 'vue-router'
import { local, session } from 'ux-web-storage'

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
import { TABS_ROUTES } from '@/store/mutation-types'

/** 超级权限码：拥有全部权限 */
export const SUPER_PERMISSION = '*:*:*'

/** 超级角色码：拥有全部角色能力 */
export const SUPER_ROLE = 'admin'

/**
 * fail-closed 权限 / 角色匹配：
 * - owned 为空 → false（未加载或无权限）
 * - 含超级码 → true
 * - 否则任一 required 命中即可
 */
export function matchAny(
  owned: Iterable<string>,
  required: string | string[] | undefined,
  superCode?: string,
): boolean {
  const ownedSet = owned instanceof Set ? owned : new Set(owned)
  if (!ownedSet.size)
    return false
  if (superCode && ownedSet.has(superCode))
    return true

  const list = required == null
    ? []
    : Array.isArray(required)
      ? required
      : [required]

  if (!list.length)
    return false

  return list.some(item => ownedSet.has(item))
}

/** 菜单权限：未声明 required 时视为公开（仍受父级过滤） */
export function matchMenuPermission(
  permissions: Iterable<string>,
  required?: string[],
): boolean {
  const ownedSet = permissions instanceof Set ? permissions : new Set(permissions)
  if (!ownedSet.size)
    return false
  if (!required?.length)
    return true
  if (ownedSet.has(SUPER_PERMISSION))
    return true
  return required.some(p => ownedSet.has(p))
}

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

  /** 防止并发 setupRoutes 重复注册 */
  let setupPromise: Promise<void> | null = null

  /** clearRoutes / 换号时递增，作废进行中的 setup */
  let setupGeneration = 0

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

  function syncSidebarMenus(menus: MenuItem[]) {
    const sidebarMenus = prepareSidebarMenus(menus)
    useMenuStore().setMenuOptions(menusToMenuOptions(sidebarMenus))
  }

  function filterMenuByPermission(menuList: MenuItem[], permissions: Set<string>): MenuItem[] {
    if (!permissions.size)
      return []

    return menuList.reduce<MenuItem[]>((acc, menu) => {
      if (!matchMenuPermission(permissions, menu.meta?.permissions))
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
    if (setupPromise)
      return setupPromise

    const generation = setupGeneration

    setupPromise = (async () => {
      try {
        viewModules.value = modules
        viewsBaseDir.value = baseDir

        const { menus, permissions, roles } = await fetchUserMenuAndPermissions()

        // 等待期间若已 clearRoutes / resetSession，丢弃本次结果
        if (generation !== setupGeneration)
          return

        userPermissions.value = permissions
        userRoles.value = roles

        const permissionSet = new Set(permissions)
        const filteredMenus = filterMenusByAvailableViews(
          filterMenuByPermission(menus, permissionSet),
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
            redirect: '/404',
          })
        }

        if (generation !== setupGeneration)
          return

        addedRouteNames.value = names
        routesLoaded.value = true

        // 动态路由就绪后，丢掉本地缓存里已无权限的 tab
        useTabsViewStore().filterAccessibleTabs(tab =>
          !!tab.name && router.hasRoute(tab.name),
        )
      }
      catch (error) {
        if (generation !== setupGeneration)
          return
        console.error('Failed to setup routes:', error)
        throw error
      }
      finally {
        if (setupPromise && generation === setupGeneration)
          setupPromise = null
      }
    })()

    return setupPromise
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
    // 作废进行中的 setup，避免清理后又把旧结果写回
    setupGeneration += 1
    setupPromise = null

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

  function clearAuthState(): void {
    userPermissions.value = []
    userRoles.value = []
    userMenuList.value = []
  }

  /** 登录成功时调用：清掉上一会话菜单、动态路由与 tab 缓存 */
  function resetSession(router: Router): void {
    clearRoutes(router)
    clearAuthState()
    try {
      delete local[TABS_ROUTES]
    }
    catch (e) {
      console.warn('Failed to clear tabs storage:', e)
    }
  }

  function logout(router: Router): void {
    clearRoutes(router)
    clearAuthState()

    try {
      local.clear()
      session.clear()
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
    setupRoutes,
    reloadRoutes,
    clearRoutes,
    resetSession,
    logout,
  }
})

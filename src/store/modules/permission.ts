import type { Router } from 'vue-router'
import { buildRoutesFromMenu, filterRoutesByPermission } from '@/router/utils/routeFilter'
import type { MenuItem, RoutePoolItem } from '@/router/utils/types'

/**
 * 权限管理 Store（类似若依框架）
 * 
 * 核心流程：
 * 1. 项目启动时根据文件约定生成路由池（不注册到路由器）
 * 2. 用户登录后从后台获取菜单配置
 * 3. 根据菜单配置从路由池中匹配路由
 * 4. 根据用户权限过滤路由
 * 5. 注册匹配的路由到路由器
 * 6. 切换账号时清空路由和缓存
 */
export const usePermissionStore = defineStore('permission', () => {
  /** 是否已加载动态路由 */
  const routesLoaded = ref(false)

  /** 动态添加的顶级路由名称列表（用于退出时清理） */
  const addedRouteNames = ref<string[]>([])

  /** 用户权限列表 */
  const userPermissions = ref<string[]>([])

  /** 用户菜单列表（后台返回） */
  const userMenuList = ref<MenuItem[]>([])

  // ─────────────────────────────────────────────────────────────────────────────
  // 模拟后台接口（实际项目中替换为真实API）
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 模拟从后台获取用户菜单和权限
   * 
   * @returns 用户菜单列表和权限列表
   */
  async function fetchUserMenuAndPermissions(): Promise<{
    menus: MenuItem[]
    permissions: string[]
  }> {
    // TODO: 替换为真实的后台API调用
    // 示例：
    // const response = await api.get('/system/menu/getUserMenu')
    // return response.data

    // 模拟数据 - 根据用户角色返回不同菜单
    // 菜单中的 name 字段用于匹配路由池中的路由
    // 注意：path 应该使用完整路径，因为路由会被添加为顶级路由
    const mockMenus: MenuItem[] = [
      {
        id: 1,
        parentId: 0,
        name: 'Index',
        path: '/',
        meta: {
          title: '首页',
          icon: 'home',
        },
        children: [
          {
            id: 2,
            parentId: 1,
            name: 'Index-Home',
            path: '/home',
            meta: {
              title: '主页',
              icon: 'home',
            },
            children: [
              {
                id: 3,
                parentId: 2,
                name: 'Index-Home-HomeIndex',
                path: '/home/homeindex',
                meta: {
                  title: '控制台',
                  icon: 'dashboard',
                },
              },
              {
                id: 8,
                parentId: 2,
                name: 'Index-Home-ModalDemo',
                path: '/home/modaldemo',
                meta: {
                  title: 'Modal 示例',
                  icon: 'dashboard',
                },
              },
              {
                id: 4,
                parentId: 2,
                name: 'Index-Home-PersonInfo',
                path: '/home/personinfo',
                meta: {
                  title: '个人信息',
                  icon: 'user',
                  permissions: ['user:info'],
                },
              },
            ],
          },
          {
            id: 5,
            parentId: 1,
            name: 'Index-System',
            path: '/system',
            meta: {
              title: '系统管理',
              icon: 'settings',
              permissions: ['system:manage'],
            },
            children: [
              {
                id: 6,
                parentId: 5,
                name: 'Index-System-User',
                path: '/system/user',
                meta: {
                  title: '用户管理',
                  icon: 'users',
                  permissions: ['system:user:list'],
                },
              },
              {
                id: 7,
                parentId: 5,
                name: 'Index-System-Role',
                path: '/system/role',
                meta: {
                  title: '角色管理',
                  icon: 'shield',
                  permissions: ['system:role:list'],
                },
              },
            ],
          },
        ],
      },
    ]

    // 模拟不同用户的权限
    const mockPermissions = ['user:info', 'system:manage', 'system:user:list']

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      menus: mockMenus,
      permissions: mockPermissions,
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 公共方法
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * 设置用户权限（用于手动设置）
   * 
   * @param permissions 权限列表
   */
  function setPermissions(permissions: string[]) {
    userPermissions.value = permissions
  }

  /**
   * 设置用户菜单（用于手动设置）
   * 
   * @param menus 菜单列表
   */
  function setMenus(menus: MenuItem[]) {
    userMenuList.value = menus
  }

  /**
   * 获取用户权限并动态设置路由（完整流程）
   * 
   * 流程：
   * 1. 从后台获取菜单和权限
   * 2. 根据菜单配置从路由池中匹配路由
   * 3. 根据用户权限过滤路由
   * 4. 注册路由到路由器
   * 
   * @param router 路由器实例
   * @param routePool 路由池（所有文件生成的路由）
   */
  async function setupRoutes(router: Router, routePool: RoutePoolItem[]): Promise<void> {
    if (routesLoaded.value) return

    try {
      // 从后台获取菜单和权限
      const { menus, permissions } = await fetchUserMenuAndPermissions()

      // 缓存权限和菜单
      userPermissions.value = permissions
      userMenuList.value = menus

      // 根据权限过滤菜单
      const filteredMenus = filterMenuByPermission(menus, permissions)

      // 根据菜单配置从路由池中匹配并构建路由
      const routes = buildRoutesFromMenu(routePool, filteredMenus, {
        matchPriority: ['name', 'path', 'filePath'],
        strictPathMatch: false,
      })

      // 添加路由到路由器
      const names: string[] = []
      routes.forEach((route) => {
        // 检查路由是否已存在
        if (route.name && router.hasRoute(route.name)) {
          return
        }
        
        router.addRoute(route)
        if (route.name) {
          names.push(String(route.name))
        }
      })

      // 添加一个通配符路由，处理未匹配的路径
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
    } catch (error) {
      console.error('Failed to setup routes:', error)
      throw error
    }
  }

  /**
   * 根据权限过滤菜单
   * 
   * @param menuList 菜单列表
   * @param permissions 用户权限列表
   * @returns 过滤后的菜单列表
   */
  function filterMenuByPermission(menuList: MenuItem[], permissions: string[]): MenuItem[] {
    return menuList.reduce<MenuItem[]>((acc, menu) => {
      // 检查权限
      const required = menu.meta?.permissions
      if (required?.length && !required.some((p) => permissions.includes(p))) {
        return acc
      }

      // 递归处理子菜单
      const filteredMenu: MenuItem = {
        ...menu,
        children: menu.children
          ? filterMenuByPermission(menu.children, permissions)
          : undefined,
      }

      // 如果子菜单全部被过滤掉且没有组件，则不添加该菜单
      if (!filteredMenu.children || filteredMenu.children.length === 0) {
        // 检查是否有对应的路由（通过name匹配）
        acc.push(filteredMenu)
      } else {
        acc.push(filteredMenu)
      }

      return acc
    }, [])
  }

  /**
   * 重新加载路由（用于权限变更后重新加载）
   * 
   * @param router 路由器实例
   * @param routePool 路由池
   */
  async function reloadRoutes(router: Router, routePool: RoutePoolItem[]): Promise<void> {
    // 先清除现有路由
    clearRoutes(router)
    
    // 重新设置路由
    await setupRoutes(router, routePool)
  }

  /**
   * 清除所有动态添加的路由
   * 
   * @param router 路由器实例
   */
  function clearRoutes(router: Router): void {
    // 移除所有动态添加的路由
    addedRouteNames.value.forEach((name) => {
      if (router.hasRoute(name)) {
        router.removeRoute(name)
      }
    })
    
    // 重置状态
    addedRouteNames.value = []
    routesLoaded.value = false
  }

  /**
   * 切换账号（退出登录）
   * 清空路由、权限、菜单和缓存
   * 
   * @param router 路由器实例
   */
  function logout(router: Router): void {
    // 清除动态路由
    clearRoutes(router)
    
    // 清空权限和菜单
    userPermissions.value = []
    userMenuList.value = []
    
    // 清空本地缓存
    try {
      // 清空 localStorage
      localStorage.clear()
      
      // 清空 sessionStorage
      sessionStorage.clear()
      
      // 如果使用了其他缓存机制，也需要清空
      // 例如：pinia 持久化存储等
    } catch (e) {
      console.warn('Failed to clear storage:', e)
    }
  }

  return {
    // 状态
    routesLoaded,
    addedRouteNames,
    userPermissions,
    userMenuList,
    
    // 方法
    setPermissions,
    setMenus,
    setupRoutes,
    filterMenuByPermission,
    reloadRoutes,
    clearRoutes,
    logout,
  }
})

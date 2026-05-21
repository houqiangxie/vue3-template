import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem, RouteMatchOptions, RoutePoolItem } from './types'

/**
 * 创建路由池（所有文件生成的路由，但不注册到路由器）
 * 
 * @param modules import.meta.glob 的结果
 * @param baseDir 基础目录
 * @returns 路由池
 */
export function createRoutePool(
  modules: Record<string, () => Promise<any>>,
  baseDir: string
): RoutePoolItem[] {
  const pool: RoutePoolItem[] = []
  const normalizedBase = baseDir.endsWith('/') ? baseDir : `${baseDir}/`

  for (const [key, loader] of Object.entries(modules)) {
    const startsWithBase = key.startsWith(normalizedBase)
    
    if (!startsWithBase) continue
    
    const relativePath = key.slice(normalizedBase.length).replace(/\.vue$/, '')
    const segments = relativePath.split('/')
    const lastName = segments[segments.length - 1]
    
    // 生成路由名称（如 Index-Home-HomeIndex）
    const name = segments.join('-')
    
    // 生成路由路径
    const path = segments.length === 1 && lastName.toLowerCase() === 'index'
      ? '/'
      : lastName.toLowerCase()

    const route: RouteRecordRaw = {
      path,
      name,
      component: loader,
      meta: {},
    }

    pool.push({
      filePath: relativePath,
      route,
    })
  }

  return pool
}

/**
 * 将嵌套的路由数组扁平化为路由池
 * 
 * @param routes 路由数组
 * @returns 路由池
 */
export function flattenRoutesToPool(routes: RouteRecordRaw[]): RoutePoolItem[] {
  let pool: RoutePoolItem[] = []

  function traverse(routeList: RouteRecordRaw[]) {
    routeList.forEach((route) => {
      if (route.name) {
        pool.push({
          filePath: String(route.name).replace(/-/g, '/'),
          route: { ...route, children: undefined }, // 路由池中的路由不应该包含子路由，因为 buildRoutesFromMenu 会重新构建
        })
      }
      if (route.children && route.children.length > 0) {
        traverse(route.children)
      }
    })
  }

  traverse(routes)
  return pool
}

/**
 * 从路由池中查找匹配的路由
 * 
 * @param pool 路由池
 * @param menu 菜单项
 * @param options 匹配选项
 * @returns 匹配的路由，如果没有匹配返回 null
 */
export function matchRouteFromPool(
  pool: RoutePoolItem[],
  menu: MenuItem | undefined,
  options: RouteMatchOptions = {}
): RouteRecordRaw | null {
  // 如果菜单为空，直接返回 null
  if (!menu) {
    return null
  }

  const { matchPriority = ['name', 'path', 'filePath'], strictPathMatch = false } = options

  for (const priority of matchPriority) {
    let matched: RoutePoolItem | undefined

    switch (priority) {
      case 'name':
        if (menu.name) {
          matched = pool.find((item) => 
            item && item.route && item.route.name && item.route.name === menu.name
          )
        }
        break

      case 'path':
        if (menu.path !== undefined && menu.path !== null) {
          // 处理根路由特殊情况：空字符串和 '/' 应该视为相同
          const normalizedMenuPath = menu.path === '' ? '/' : menu.path
          matched = pool.find((item) => {
            if (!item || !item.route || !item.route.path) return false
            const normalizedRoutePath = item.route.path === '' ? '/' : item.route.path
            if (strictPathMatch) {
              return normalizedRoutePath === normalizedMenuPath
            }
            // 模糊匹配：路由路径包含菜单路径
            const routePath = normalizedRoutePath
            const menuPath = normalizedMenuPath
            return routePath.toLowerCase().includes(menuPath.toLowerCase()) ||
                   menuPath.toLowerCase().includes(routePath.toLowerCase())
          })
        }
        break

      case 'filePath':
        if (menu.name) {
          // 将 name 转换为文件路径格式进行匹配
          const filePathPattern = menu.name.replace(/-/g, '/')
          matched = pool.find((item) => 
            item && item.filePath && (
              item.filePath.toLowerCase() === filePathPattern.toLowerCase() ||
              item.filePath.toLowerCase().includes(filePathPattern.toLowerCase())
            )
          )
        }
        break
    }

    if (matched && matched.route) {
      // 合并菜单配置到路由
      const mergedRoute: RouteRecordRaw = {
        ...matched.route,
        path: menu.path || matched.route.path,
        name: menu.name || matched.route.name,
        meta: {
          ...matched.route.meta,
          ...menu.meta,
          title: menu.meta?.title || '',
          keepAlive: menu.keepAlive ?? matched.route.meta?.keepAlive ?? false,
        },
      }
      return mergedRoute
    }
  }

  return null
}

/**
 * 根据菜单列表从路由池中构建路由树（扁平化结构）
 * 每个路由使用完整路径注册，不使用嵌套 children
 * 
 * @param pool 路由池
 * @param menuList 菜单列表
 * @param options 匹配选项
 * @returns 构建好的路由数组
 */
export function buildRoutesFromMenu(
  pool: RoutePoolItem[],
  menuList: MenuItem[] | undefined,
  options: RouteMatchOptions = {}
): RouteRecordRaw[] {
  if (!menuList || menuList.length === 0) {
    return []
  }

  function normalizePath(path: string | undefined): string {
    if (!path) return '/'
    if (path.startsWith('/')) return path
    return '/' + path
  }

  function getRelativePath(childPath: string, parentPath: string): string {
    const normalizedChild = childPath.startsWith('/') ? childPath.slice(1) : childPath
    const normalizedParent = parentPath.startsWith('/') ? parentPath.slice(1) : parentPath
    const cleanParent = normalizedParent.endsWith('/') ? normalizedParent.slice(0, -1) : normalizedParent
    
    if (!cleanParent || cleanParent === '/') {
      return normalizedChild
    }
    
    return normalizedChild.replace(new RegExp(`^${cleanParent}/`), '')
  }

  function buildRoute(menu: MenuItem | undefined, parentPath: string = ''): RouteRecordRaw | null {
    if (!menu) return null
    if (!menu.name) {
      return null
    }
    if (menu.hidden) return null

    const matchedRoute = matchRouteFromPool(pool, menu, options)
    if (!matchedRoute) {
      return null
    }

    const menuPath = menu.path || matchedRoute.path || '/'
    const routePath = parentPath ? getRelativePath(menuPath, parentPath) : normalizePath(menuPath)

    const route: RouteRecordRaw = {
      ...matchedRoute,
      path: routePath,
    }

    if (menu.children && menu.children.length > 0) {
      const childRoutes = menu.children
        .map((child) => buildRoute(child, menuPath))
        .filter((r): r is RouteRecordRaw => r !== null)
      if (childRoutes.length > 0) {
        route.children = childRoutes
      }
    }

    return route
  }

  return menuList
    .map((menu) => buildRoute(menu))
    .filter((r): r is RouteRecordRaw => r !== null)
}

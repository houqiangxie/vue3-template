import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from './types'
import ParentView from '@/components/ParentView/index.vue'

export type ViewModules = Record<string, () => Promise<any>>

const DIRECTORY_COMPONENTS = new Set(['ParentView', 'Layout', 'ParentView/index'])
const IFRAME_COMPONENTS = new Set([
  'system/iFrame/index',
  'System/IFrame',
  'common/IFrame',
  'IFrame',
])

function isDirectoryComponent(component?: string): boolean {
  if (!component)
    return false
  return DIRECTORY_COMPONENTS.has(component.replace(/^\/+/, ''))
}

function isIFrameComponent(component?: string): boolean {
  if (!component)
    return false
  return IFRAME_COMPONENTS.has(component.replace(/^\/+/, ''))
}

/** 按钮权限节点不参与路由 / 侧栏 */
export function isButtonMenu(menu: MenuItem): boolean {
  const t = menu.type
  return t === 3 || t === '3' || t === 'F'
}

function isHttpPath(path?: string): boolean {
  return !!path && /^https?:\/\//.test(path)
}

export function sortMenusByOrder(menus: MenuItem[]): MenuItem[] {
  const sorted = [...menus].sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0))
  return sorted.map(menu => ({
    ...menu,
    children: menu.children?.length ? sortMenusByOrder(menu.children) : menu.children,
  }))
}

/** 剔除按钮节点，保留目录/菜单/页面级菜单树（侧栏用） */
export function filterRouteMenus(menus: MenuItem[]): MenuItem[] {
  return menus.reduce<MenuItem[]>((acc, menu) => {
    if (isButtonMenu(menu))
      return acc

    const children = menu.children?.length
      ? filterRouteMenus(menu.children)
      : undefined

    acc.push({
      ...menu,
      children,
    })
    return acc
  }, [])
}

/**
 * 按当前入口 views 是否存在对应组件过滤菜单。
 * App 端无 System 管理页时，可去掉后台下发的系统管理/监控菜单，避免侧栏空链。
 */
export function filterMenusByAvailableViews(
  menus: MenuItem[],
  modules: ViewModules,
  baseDir: string,
): MenuItem[] {
  return menus.reduce<MenuItem[]>((acc, menu) => {
    if (isButtonMenu(menu) || isHttpPath(menu.path))
      return acc

    const children = menu.children?.length
      ? filterMenusByAvailableViews(menu.children, modules, baseDir)
      : undefined

    if (isDirectoryComponent(menu.component)) {
      if (!children?.length)
        return acc
      acc.push({ ...menu, children })
      return acc
    }

    const hasSelf = !!resolveViewComponent(modules, baseDir, menu.component)

    if (children?.length) {
      if (!hasSelf) {
        acc.push(...children)
        return acc
      }
      acc.push({ ...menu, children })
      return acc
    }

    if (hasSelf)
      acc.push({ ...menu, children: undefined })

    return acc
  }, [])
}

/**
 * 根据菜单中的 component 字段，从 import.meta.glob 结果中解析组件
 */
export function resolveViewComponent(
  modules: ViewModules,
  baseDir: string,
  component?: string,
): (() => Promise<any>) | undefined {
  if (!component)
    return undefined

  const raw = component.replace(/^\/+/, '')

  if (isDirectoryComponent(raw))
    return () => Promise.resolve({ default: ParentView })

  if (isIFrameComponent(raw))
    return () => import('@/views/common/IFrame.vue')

  // 兼容旧菜单：Index 模块目录统一指向 Index/index.vue
  const normalizedComponent = raw === 'Index' ? 'Index/index' : raw

  const normalizedBase = baseDir.endsWith('/') ? baseDir : `${baseDir}/`
  const directKey = `${normalizedBase}${normalizedComponent}.vue`

  if (modules[directKey])
    return modules[directKey]

  const indexKey = `${normalizedBase}${normalizedComponent}/index.vue`
  if (modules[indexKey])
    return modules[indexKey]

  const suffix = `/${normalizedComponent}.vue`
  const matchedKey = Object.keys(modules).find(k => k.endsWith(suffix))
  return matchedKey ? modules[matchedKey] : undefined
}

function normalizePath(path: string | undefined): string {
  if (!path)
    return '/'
  if (isHttpPath(path))
    return path
  const cleaned = path.replace(/\/+/g, '/')
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`
}

/** 拼接父子 path，兼容绝对/相对两种后台写法（对齐 guanweb filterAsyncRouter2） */
export function joinMenuPath(parentPath: string, childPath: string): string {
  if (isHttpPath(childPath))
    return childPath

  const parent = normalizePath(parentPath).replace(/\/$/, '')
  const childRaw = childPath || ''

  if (!parent || parent === '/')
    return normalizePath(childRaw)

  // 子路径已是完整路径时不重复拼接
  const childAbs = normalizePath(childRaw)
  if (childAbs === parent || childAbs.startsWith(`${parent}/`))
    return childAbs

  return normalizePath(`${parent}/${childRaw.replace(/^\/+/, '')}`)
}

function getRelativePath(childPath: string, parentPath: string): string {
  const normalizedChild = normalizePath(childPath).replace(/^\//, '')
  const cleanParent = normalizePath(parentPath).replace(/^\//, '').replace(/\/$/, '')

  if (!cleanParent || cleanParent === '/')
    return normalizedChild

  return normalizedChild.replace(new RegExp(`^${cleanParent}/`), '')
}

/** 统一解析缓存开关：keepAlive / cacheFlag / isCache / meta.noCache */
export function resolveKeepAlive(menu: MenuItem): boolean {
  if (typeof menu.keepAlive === 'boolean')
    return menu.keepAlive
  if (typeof menu.cacheFlag === 'boolean')
    return menu.cacheFlag
  if (menu.isCache === '0' || menu.isCache === true)
    return true
  if (menu.isCache === '1' || menu.isCache === false)
    return false
  if (typeof menu.meta?.keepAlive === 'boolean')
    return menu.meta.keepAlive
  if (typeof menu.meta?.noCache === 'boolean')
    return !menu.meta.noCache
  return false
}

function buildRouteMeta(menu: MenuItem) {
  return {
    title: menu.meta?.title ?? '',
    icon: menu.meta?.icon,
    permissions: menu.meta?.permissions,
    ignoreAuth: menu.meta?.ignoreAuth,
    affix: menu.meta?.affix,
    keepAlive: resolveKeepAlive(menu),
    activeMenu: menu.meta?.activeMenu,
    breadcrumb: menu.meta?.breadcrumb,
    iFrameUrl: menu.meta?.iFrameUrl,
    alwaysShow: menu.alwaysShow,
    /** 侧栏不展示，但路由可访问（下钻页） */
    hidden: menu.hidden,
  }
}

function resolveRedirect(menu: MenuItem, childRoutes: RouteRecordRaw[]) {
  if (menu.redirect && menu.redirect !== 'noRedirect') {
    const byName = childRoutes.find(r => r.name === menu.redirect)
    if (byName?.name)
      return { name: byName.name as string }
    return menu.redirect
  }

  if (menu.redirect === 'noRedirect')
    return undefined

  const firstNamedChild = childRoutes.find(r => r.name)
  if (firstNamedChild?.name)
    return { name: firstNamedChild.name as string }

  return undefined
}

/**
 * 将后台菜单调整为 Layout 的直接子路由来源。
 * 兼容旧结构：顶层 component 为 Index（layout 占位）时，展开其 children。
 */
export function normalizeMenusForLayout(menus: MenuItem[]): MenuItem[] {
  if (menus.length !== 1)
    return menus

  const root = menus[0]
  const comp = root.component?.replace(/^\/+/, '')
  const isLayoutWrapper = (comp === 'Index' || isDirectoryComponent(comp))
    && root.children?.length

  return isLayoutWrapper ? root.children! : menus
}

/**
 * 对齐 guanweb loadView：强制 component.name = 路由 name，
 * 保证 keep-alive include 与 router.push({ name }) 一致。
 */
function withComponentName(
  loader: () => Promise<any>,
  name?: string,
): () => Promise<any> {
  if (!name)
    return loader
  return () => loader().then((mod) => {
    const component = mod?.default
    if (component)
      component.name = name
    return mod
  })
}

function createLeafRoute(
  modules: ViewModules,
  baseDir: string,
  menu: MenuItem,
  routePath: string,
): RouteRecordRaw | null {
  const route: RouteRecordRaw = {
    path: routePath,
    name: menu.name,
    meta: buildRouteMeta(menu),
  }

  if (isIFrameComponent(menu.component)) {
    const iframeUrl = menu.meta?.iFrameUrl
      || (menu.redirect && menu.redirect !== 'noRedirect' ? menu.redirect : undefined)
    if (iframeUrl) {
      route.meta = {
        ...route.meta,
        iFrameUrl: iframeUrl,
      }
    }
  }

  const component = resolveViewComponent(modules, baseDir, menu.component)
  if (component)
    route.component = withComponentName(component, menu.name)

  if (!route.component) {
    console.warn(
      `[buildDynamicRoutes] 未找到组件「${menu.component}」，跳过路由 ${menu.name}。`
      + ' 若为新建页面，请重启 Vite 使 import.meta.glob 生效。',
    )
    return null
  }

  return route
}

/**
 * 对齐 guanweb `filterAsyncRouter2`：
 * - ParentView / Layout 目录不注册，子路由提升为 Layout 直属子路由，path 拼接完整
 * - 普通带 children 的页面组件仍保留嵌套（相对 path）
 */
export function buildDynamicRoutes(
  modules: ViewModules,
  baseDir: string,
  menuList: MenuItem[],
): RouteRecordRaw[] {
  /**
   * @param menus 当前层菜单
   * @param pathPrefix 已被扁平化父目录累积的 path（空表示 Layout 顶层）
   * @param nestUnder 若在真实组件下嵌套，传入父绝对 path，子 path 转为相对
   */
  function walk(
    menus: MenuItem[],
    pathPrefix = '',
    nestUnder?: string,
  ): RouteRecordRaw[] {
    const result: RouteRecordRaw[] = []

    for (const menu of menus) {
      // 按钮 / 外链不注册；hidden 仅侧栏隐藏，路由仍需注册（字典数据、分配用户等下钻页）
      if (isButtonMenu(menu) || isHttpPath(menu.path))
        continue

      const absolutePath = pathPrefix
        ? joinMenuPath(pathPrefix, menu.path || '')
        : normalizePath(menu.path || '/')

      // —— 目录：扁平化（对齐 guanweb）——
      if (isDirectoryComponent(menu.component)) {
        if (menu.children?.length)
          result.push(...walk(menu.children, absolutePath, nestUnder))
        continue
      }

      const routePath = nestUnder
        ? getRelativePath(absolutePath, nestUnder)
        : absolutePath

      // —— 有子菜单的真实页面组件：保留嵌套 ——
      if (menu.children?.length) {
        const childRoutes = walk(menu.children, absolutePath, absolutePath)
        if (!childRoutes.length)
          continue

        const component = resolveViewComponent(modules, baseDir, menu.component)
        const route: RouteRecordRaw = {
          path: nestUnder ? routePath : absolutePath,
          name: menu.name,
          meta: buildRouteMeta(menu),
          children: childRoutes,
        }
        if (component)
          route.component = withComponentName(component, menu.name)

        const redirect = resolveRedirect(menu, childRoutes)
        if (redirect)
          route.redirect = redirect

        if (!route.component && !route.children?.length)
          continue

        result.push(route)
        continue
      }

      // —— 叶子页面（含 hidden 下钻页）——
      const leaf = createLeafRoute(modules, baseDir, menu, nestUnder ? routePath : absolutePath)
      if (leaf)
        result.push(leaf)
    }

    return result
  }

  return walk(menuList)
}

/**
 * 侧栏用菜单树：排序 + 剔按钮，保留目录层级（含 ParentView）
 */
export function prepareSidebarMenus(menus: MenuItem[]): MenuItem[] {
  return sortMenusByOrder(filterRouteMenus(menus))
}

/**
 * 获取默认跳转路由名称（第一个可访问的叶子菜单）
 */
export function getDefaultRouteName(menuList: MenuItem[]): string | undefined {
  for (const menu of menuList) {
    if (menu.hidden || isButtonMenu(menu) || isHttpPath(menu.path))
      continue

    if (menu.children?.length) {
      const childName = getDefaultRouteName(menu.children)
      if (childName)
        return childName
    }
    else if (menu.name && (menu.component || menu.meta?.iFrameUrl)) {
      if (!isDirectoryComponent(menu.component))
        return menu.name
    }
  }
  return undefined
}

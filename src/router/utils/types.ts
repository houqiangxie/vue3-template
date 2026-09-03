/**
 * 后台返回的菜单数据结构
 * - type 1/M 目录 → component 常用 ParentView，注册路由时扁平到 Layout
 * - type 2/C 菜单 → 页面组件；父级 component=TabView 时承载页面级子菜单
 * - type 3/F 按钮 → 只进 permissions，不进路由/侧栏
 * - type 4/P 页面级菜单 → 注册路由，侧栏不展示，由父级 TabView 以页内 tabs 渲染
 */
export interface MenuItem {
  /** 菜单ID */
  id: number
  /** 父菜单ID，0表示根菜单 */
  parentId: number
  /** 路由名称（keep-alive / 侧栏 key） */
  name: string
  /** 路由路径 */
  path: string
  /**
   * 组件路径（相对 views 目录）
   * 特殊值：
   * - ParentView / Layout — 目录节点，注册路由时会扁平化到 Layout 下
   * - TabView — 页面级菜单宿主，子菜单以页内 tabs 展示
   */
  component?: string
  /** 重定向：子路由 name、path，或 'noRedirect' */
  redirect?: string
  /** 是否缓存 */
  keepAlive?: boolean
  /** 缓存标记（与 cache 同义） */
  cacheFlag?: boolean
  /** 兼容 isCache：'1' 缓存 / '0' 不缓存 */
  isCache?: '0' | '1' | boolean
  /** 是否在侧栏隐藏 */
  hidden?: boolean
  /** 目录下仅一个子菜单时是否仍显示目录 */
  alwaysShow?: boolean
  /** 排序号（越小越靠前） */
  orderNum?: number
  /**
   * 菜单类型（可选，兼容扁平 menList）
   * 1 / M = 目录，2 / C = 菜单，3 / F = 按钮，4 / P = 页面级菜单（Tab）
   */
  type?: number | string
  /** 菜单元信息 */
  meta: {
    /** 菜单标题 */
    title: string
    /** 图标（字符串名，如 HomeOutlined） */
    icon?: string
    /** 权限标识列表 */
    permissions?: string[]
    /** 是否忽略权限 */
    ignoreAuth?: boolean
    /** 是否固定在标签页 */
    affix?: boolean
    /** 是否缓存（也可写在菜单根级 keepAlive） */
    keepAlive?: boolean
    /** 兼容 meta.noCache（true = 不缓存） */
    noCache?: boolean
    /** 高亮侧栏的菜单 name */
    activeMenu?: string
    /** 面包屑中是否显示（false 则隐藏） */
    breadcrumb?: boolean
    /** iframe 地址（component 为 iframe 页时） */
    iFrameUrl?: string
    /** iframe 宿主路由 base path（不含 catch-all），用于 URL 同步 */
    iFrameBasePath?: string
  }
  /** 子菜单 */
  children?: MenuItem[]
}

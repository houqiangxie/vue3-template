import type { RouteRecordRaw } from 'vue-router'

/**
 * 后台返回的菜单数据结构（类似若依框架）
 * 只包含路由匹配信息，不包含组件路径
 */
export interface MenuItem {
  /** 菜单ID */
  id: number
  /** 父菜单ID，0表示根菜单 */
  parentId: number
  /** 路由名称（用于匹配文件路由） */
  name: string
  /** 路由路径 */
  path: string
  /** 是否缓存 */
  keepAlive?: boolean
  /** 是否隐藏 */
  hidden?: boolean
  /** 菜单元信息 */
  meta: {
    /** 菜单标题 */
    title: string
    /** 图标 */
    icon?: string
    /** 权限标识列表 */
    permissions?: string[]
    /** 是否忽略权限 */
    ignoreAuth?: boolean
    /** 是否固定在标签页 */
    affix?: boolean
  }
  /** 子菜单 */
  children?: MenuItem[]
}

/**
 * 路由匹配选项
 */
export interface RouteMatchOptions {
  /** 匹配优先级：name > path > filePath */
  matchPriority?: ('name' | 'path' | 'filePath')[]
  /** 是否严格匹配路径 */
  strictPathMatch?: boolean
}

/**
 * 路由池项
 */
export interface RoutePoolItem {
  /** 原始文件路径 */
  filePath: string
  /** 生成的路由 */
  route: RouteRecordRaw
}

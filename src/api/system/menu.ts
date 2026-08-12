import type { SysMenu } from './types'
import { del, get, post, put } from '@/utils/fetch'

export interface MenuTreeOption {
  label: string
  key: number
  children?: MenuTreeOption[]
}

function flattenMenuTree(menus: SysMenu[]): SysMenu[] {
  return menus.flatMap((m) => {
    const { children, ...rest } = m
    return [rest as SysMenu, ...(children?.length ? flattenMenuTree(children) : [])]
  })
}

function buildTree(list: SysMenu[], parentId = 0): SysMenu[] {
  return list
    .filter(m => m.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map(m => ({
      ...m,
      children: buildTree(list, m.menuId),
    }))
    .map((m) => {
      if (!m.children?.length)
        delete m.children
      return m
    })
}

/** 菜单列表（树形） */
export async function listMenu(query: Record<string, unknown> = {}) {
  const res = await get<SysMenu[]>('/system/menu/list', query)
  const data = res.data ?? []
  if (data.some(m => m.children?.length))
    return res
  return { ...res, data: buildTree(data) }
}

/** 菜单列表（扁平） */
export async function listMenuFlat(query: Record<string, unknown> = {}) {
  const { data } = await listMenu(query)
  return flattenMenuTree(data ?? [])
}

/** 菜单详情 */
export function getMenu(menuId: number) {
  return get<SysMenu>(`/system/menu/${menuId}`)
}

/** 新增菜单 */
export function addMenu(data: Partial<SysMenu>) {
  return post('/system/menu', data)
}

/** 修改菜单 */
export function updateMenu(data: Partial<SysMenu>) {
  return put('/system/menu', data)
}

/** 删除菜单 */
export function deleteMenu(menuId: number) {
  return del(`/system/menu/${menuId}`)
}

/** 上级菜单下拉树 */
export function menuToTreeOptions(flatList: SysMenu[], excludeId?: number): MenuTreeOption[] {
  function buildOptions(parentId: number): MenuTreeOption[] {
    return flatList
      .filter(m => m.parentId === parentId && m.menuId !== excludeId && m.menuType !== 'F')
      .sort((a, b) => a.orderNum - b.orderNum)
      .map((menu) => {
        const children = buildOptions(menu.menuId)
        return {
          label: menu.menuName,
          key: menu.menuId,
          ...(children.length ? { children } : {}),
        }
      })
  }
  return buildOptions(0)
}

/** 角色权限分配树 */
export function menuToTreeSelectData(menus: SysMenu[]): MenuTreeOption[] {
  return menus.map(m => ({
    key: m.menuId,
    label: m.menuName,
    children: m.children?.length ? menuToTreeSelectData(m.children) : undefined,
  }))
}

/** 角色已选菜单 */
export function getRoleMenuIds(roleId: number) {
  return get<{ checkedKeys: number[] }>(`/system/menu/roleMenuTreeselect/${roleId}`)
}

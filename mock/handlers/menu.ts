import type { SysMenu } from '../../src/api/system/types'
import type { MockRoute } from '../utils'
import { fail, ok } from '../utils'
import { genMenuId, menus, roles, stampCreateTime } from '../data/store'

export const menuRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/system/menu/list',
    handler: (req) => {
      let list = [...menus]
      const menuName = req.query.menuName?.trim()
      const status = req.query.status
      if (menuName)
        list = list.filter(m => m.menuName.includes(menuName))
      if (status !== undefined && status !== '')
        list = list.filter(m => m.status === status)
      return ok(list)
    },
  },
  {
    method: 'GET',
    path: '/system/menu/roleMenuTreeselect/:roleId',
    handler: (req) => {
      const roleId = Number(req.params.roleId)
      const role = roles.find(r => r.roleId === roleId)
      return ok({ checkedKeys: role?.menuIds ?? [] })
    },
  },
  {
    method: 'GET',
    path: '/system/menu/:menuId',
    handler: (req) => {
      const menuId = Number(req.params.menuId)
      const menu = menus.find(m => m.menuId === menuId)
      if (!menu)
        return fail('菜单不存在')
      return ok({ ...menu })
    },
  },
  {
    method: 'POST',
    path: '/system/menu',
    handler: (req) => {
      const body = req.body as Partial<SysMenu>
      if (!body.menuName)
        return fail('菜单名称不能为空')
      const row = stampCreateTime({
        menuId: genMenuId(),
        parentId: body.parentId ?? 0,
        menuName: body.menuName,
        menuType: body.menuType || 'C',
        orderNum: body.orderNum ?? 0,
        routeName: body.routeName,
        path: body.path,
        component: body.component,
        activeMenu: body.activeMenu,
        perms: body.perms,
        redirect: body.redirect,
        icon: body.icon,
        isCache: body.isCache || '0',
        breadcrumb: body.breadcrumb || '0',
        workbench: body.workbench || '1',
        visible: body.visible || '0',
        status: body.status || '0',
      } as SysMenu)
      menus.push(row)
      return ok(null)
    },
  },
  {
    method: 'PUT',
    path: '/system/menu',
    handler: (req) => {
      const body = req.body as Partial<SysMenu>
      const idx = menus.findIndex(m => m.menuId === body.menuId)
      if (idx < 0)
        return fail('菜单不存在')
      menus[idx] = { ...menus[idx], ...body, menuId: menus[idx].menuId }
      return ok(null)
    },
  },
  {
    method: 'DELETE',
    path: '/system/menu/:menuId',
    handler: (req) => {
      const menuId = Number(req.params.menuId)
      if (menus.some(m => m.parentId === menuId))
        return fail('存在子菜单，无法删除')
      const idx = menus.findIndex(m => m.menuId === menuId)
      if (idx < 0)
        return fail('菜单不存在')
      menus.splice(idx, 1)
      return ok(null)
    },
  },
]

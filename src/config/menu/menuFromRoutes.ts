import type { MenuOption } from 'naive-ui'
import type { MenuItem } from '@/router/utils/types'
import { resolveMenuIcon } from './resolveMenuIcon'

function isHttpPath(path?: string) {
  return !!path && /^https?:\/\//.test(path)
}

function visibleChildren(menu: MenuItem): MenuItem[] {
  return (menu.children ?? []).filter(c => !c.hidden && !isButtonType(c))
}

function isButtonType(menu: MenuItem): boolean {
  const t = menu.type
  return t === 3 || t === '3' || t === 'F'
}

/**
 * 对齐 guanweb SidebarItem：仅一个可见子菜单且未 alwaysShow 时，提升子项到当前层
 */
function promoteIfSingleChild(menu: MenuItem): MenuItem {
  const kids = visibleChildren(menu)
  if (kids.length === 1 && !menu.alwaysShow)
    return kids[0]
  return menu
}

function toMenuOption(menu: MenuItem): MenuOption | null {
  if (menu.hidden || isButtonType(menu))
    return null

  const display = promoteIfSingleChild(menu)
  const kids = visibleChildren(display)
  const children = kids
    .map(toMenuOption)
    .filter((m): m is MenuOption => m !== null)

  // 外链：用 path 作为 key，侧栏点击时 window.open
  if (isHttpPath(display.path)) {
    return {
      label: display.meta?.title ?? display.name,
      key: display.path,
      icon: resolveMenuIcon(display.meta?.icon ?? menu.meta?.icon),
    }
  }

  const option: MenuOption = {
    label: display.meta?.title ?? display.name,
    key: display.name,
    icon: resolveMenuIcon(display.meta?.icon ?? menu.meta?.icon),
  }

  if (children.length)
    option.children = children

  return option
}

/** 将后台菜单树转为 Naive UI 侧栏 MenuOption（对齐 guanweb sidebarRouters） */
export function menusToMenuOptions(menus: MenuItem[]): MenuOption[] {
  return menus
    .map(toMenuOption)
    .filter((m): m is MenuOption => m !== null)
}

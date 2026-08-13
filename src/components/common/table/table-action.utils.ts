import type { DropdownOption } from 'naive-ui'
import type {
  TableActionConfirmConfig,
  TableActionItem,
  TableActionPopconfirmConfig,
} from './types'

/** 权限检查（可在 setup 外调用） */
export function hasPermission(perm?: string | string[]): boolean {
  if (!perm)
    return true
  const permissionStore = usePermissionStore()
  const perms = permissionStore.userPermissions
  // 权限尚未加载或为空：默认拒绝（fail-closed），避免未鉴权时按钮全开
  if (!perms.length)
    return false
  if (perms.includes('*:*:*'))
    return true
  const required = Array.isArray(perm) ? perm : [perm]
  return required.some(p => perms.includes(p))
}

/** 解析操作唯一 key，优先 key / label，否则用索引兜底 */
export function resolveActionKey<T>(action: TableActionItem<T>, index = 0) {
  if (action.key)
    return action.key
  if (typeof action.label === 'string' && action.label)
    return action.label
  return `action-${index}`
}

/** 解析按钮文案，支持按行动态函数 */
export function resolveLabel<T>(action: TableActionItem<T>, row: T) {
  return resolveRowValue(action.label, row, '')
}

/** 解析气泡确认配置，兼容 popconfirm / popConfirm 两种字段名 */
export function resolvePopconfirm<T>(action: TableActionItem<T>, row?: T) {
  const value = action.popconfirm ?? action.popConfirm
  if (!value)
    return undefined
  if (row !== undefined && typeof value === 'function')
    return (value as (currentRow: T) => string | TableActionPopconfirmConfig)(row)
  if (typeof value === 'function')
    return undefined
  return value
}

/** 提取 popconfirm 展示文案 */
export function resolvePopconfirmTitle<T>(action: TableActionItem<T>, row: T) {
  const popconfirm = resolvePopconfirm(action, row)
  if (!popconfirm)
    return ''
  return typeof popconfirm === 'string' ? popconfirm : popconfirm.title
}

/** 解析弹窗确认配置 */
export function resolveConfirm<T>(action: TableActionItem<T>, row?: T) {
  const value = action.confirm
  if (!value)
    return undefined
  if (row !== undefined && typeof value === 'function')
    return (value as (currentRow: T) => string | TableActionConfirmConfig)(row)
  if (typeof value === 'function')
    return undefined
  return value
}

/** 归一化为 dialog 可用配置 */
export function normalizeConfirmConfig(value: string | TableActionConfirmConfig) {
  if (typeof value === 'string') {
    return {
      title: '确认',
      content: value,
      positiveText: '确定',
      negativeText: '取消',
      type: 'warning' as const,
    }
  }
  return {
    title: value.title ?? '确认',
    content: value.content,
    positiveText: value.positiveText ?? '确定',
    negativeText: value.negativeText ?? '取消',
    type: value.type ?? 'warning',
  }
}

/** 解析静态值或 (row) => value 形式的动态配置 */
export function resolveRowValue<T, R>(
  value: R | ((row: T) => R) | undefined,
  row: T,
  fallback: R,
) {
  if (typeof value === 'function')
    return (value as (currentRow: T) => R)(row)
  if (value === undefined)
    return fallback
  return value
}

/** 判断单个操作是否可见：权限 + show 动态条件 */
export function isActionVisible<T>(action: TableActionItem<T>, row: T) {
  if (!hasPermission(action.permission))
    return false
  return resolveRowValue(action.show, row, true)
}

/** 按 order 升序排列，未设置 order 的排在后面 */
export function sortActions<T>(actions: TableActionItem<T>[]) {
  return actions
    .map((action, index) => ({ action, index }))
    .sort((left, right) => {
      const leftOrder = left.action.order ?? Number.MAX_SAFE_INTEGER
      const rightOrder = right.action.order ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder)
        return leftOrder - rightOrder
      return left.index - right.index
    })
    .map(item => item.action)
}

/** 递归过滤可见操作，并清理无效子节点 */
export function filterVisibleActions<T>(actions: TableActionItem<T>[], row: T): TableActionItem<T>[] {
  return sortActions(actions)
    .filter(action => isActionVisible(action, row))
    .map((action) => {
      if (!action.children?.length)
        return action
      return {
        ...action,
        children: filterVisibleActions(action.children, row),
      }
    })
    .filter((action) => {
      if (action.divider || action.render)
        return true
      if (action.children?.length)
        return true
      return Boolean(resolveLabel(action, row) || action.onClick)
    })
}

/** 清理首尾及连续分割线 */
export function cleanDividerActions<T>(actions: TableActionItem<T>[]) {
  const result: TableActionItem<T>[] = []

  for (const action of actions) {
    if (action.divider) {
      if (!result.length || result[result.length - 1]?.divider)
        continue
      result.push(action)
      continue
    }
    result.push(action)
  }

  if (result.length && result[result.length - 1]?.divider)
    result.pop()

  return result
}

/** 按 max 拆分行内按钮与「更多」区域，支持 action.more 强制收起 */
export function splitInlineAndMore<T>(
  actions: TableActionItem<T>[],
  max: number,
) {
  const explicitMore: TableActionItem<T>[] = []
  const explicitInline: TableActionItem<T>[] = []

  for (const action of actions) {
    if (action.more)
      explicitMore.push(action)
    else
      explicitInline.push(action)
  }

  if (explicitInline.length <= max) {
    return {
      inline: explicitInline,
      more: explicitMore,
    }
  }

  return {
    inline: explicitInline.slice(0, max),
    more: [...explicitInline.slice(max), ...explicitMore],
  }
}

/** 递归收集所有操作项，生成 key -> action 映射供下拉选中查找 */
export function collectActionMap<T>(
  actions: TableActionItem<T>[],
  map = new Map<string, TableActionItem<T>>(),
  prefix = '',
) {
  actions.forEach((action, index) => {
    const key = prefix ? `${prefix}/${resolveActionKey(action, index)}` : resolveActionKey(action, index)
    map.set(key, action)
    if (action.children?.length)
      collectActionMap(action.children, map, key)
  })
  return map
}

/** 清理下拉选项首尾及连续分割线 */
export function cleanDropdownOptions(options: DropdownOption[]) {
  const result: DropdownOption[] = []

  for (const option of options) {
    if (option.type === 'divider') {
      if (!result.length || result[result.length - 1]?.type === 'divider')
        continue
      result.push(option)
      continue
    }
    result.push(option)
  }

  if (result.length && result[result.length - 1]?.type === 'divider')
    result.pop()

  return result
}

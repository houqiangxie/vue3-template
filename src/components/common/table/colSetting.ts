import type { UnifiedFieldConfig } from './fieldSchema'
import { isFieldInScene } from './fieldSchema'
import type { ColSettingItem } from './types'
import { local } from 'ux-web-storage'

const STORAGE_PREFIX = '__table_col_setting__'

function resolveFieldKey(field: UnifiedFieldConfig): string {
  return typeof field.key === 'string' ? field.key : field.key[0]
}

function resolveFieldLabel(field: UnifiedFieldConfig): string {
  return field.label ?? field.title ?? resolveFieldKey(field)
}

/** 是否为操作列 */
export function isActionsField(field: UnifiedFieldConfig): boolean {
  const key = resolveFieldKey(field)
  const label = resolveFieldLabel(field)
  return key === 'actions' || key === 'action' || label === '操作'
}

/** 是否可参与列设置（显隐 / 排序）；分组列本身不进列表，只平铺叶子 */
export function isColSettingField(field: UnifiedFieldConfig): boolean {
  if (!isFieldInScene(field, 'table'))
    return false
  if (isActionsField(field))
    return false
  const kids = field.children?.filter(f => isFieldInScene(f, 'table')) ?? []
  if (kids.length)
    return false
  const table = field.table === false ? undefined : field.table
  if (table?.hideInSetting)
    return false
  return true
}

/** 平铺可配置叶子列（多级表头只出现叶子） */
export function flattenColSettingFields(fields: UnifiedFieldConfig[]): UnifiedFieldConfig[] {
  const leaves: UnifiedFieldConfig[] = []
  for (const field of fields) {
    if (!isFieldInScene(field, 'table'))
      continue
    const kids = field.children?.filter(f => isFieldInScene(f, 'table')) ?? []
    if (kids.length) {
      leaves.push(...flattenColSettingFields(kids))
      continue
    }
    if (isColSettingField(field))
      leaves.push(field)
  }
  return leaves
}

/** 读取本地列设置 */
export function loadColSetting(storageKey: string): ColSettingItem[] | null {
  try {
    const cached = local[`${STORAGE_PREFIX}${storageKey}`] as ColSettingItem[] | undefined
    return Array.isArray(cached) ? cached : null
  }
  catch {
    return null
  }
}

/** 保存本地列设置 */
export function saveColSetting(storageKey: string, items: ColSettingItem[]) {
  local[`${STORAGE_PREFIX}${storageKey}`] = items
}

/** 清除本地列设置 */
export function clearColSetting(storageKey: string) {
  delete local[`${STORAGE_PREFIX}${storageKey}`]
}

/** 根据当前 fields 构建列设置列表（合并本地缓存的顺序与显隐） */
export function buildColSettingItems(
  fields: UnifiedFieldConfig[],
  storageKey?: string,
): ColSettingItem[] {
  const configurable = flattenColSettingFields(fields)
  const cached = storageKey ? loadColSetting(storageKey) : null
  if (!cached?.length) {
    return configurable.map(field => ({
      key: resolveFieldKey(field),
      label: resolveFieldLabel(field),
      isShow: field.table !== false && field.table?.isShow !== false,
    }))
  }

  const fieldMap = new Map(configurable.map(f => [resolveFieldKey(f), f]))
  const result: ColSettingItem[] = []
  const used = new Set<string>()

  for (const item of cached) {
    const field = fieldMap.get(item.key)
    if (!field)
      continue
    result.push({
      key: item.key,
      label: resolveFieldLabel(field),
      isShow: item.isShow !== false,
    })
    used.add(item.key)
  }

  for (const field of configurable) {
    const key = resolveFieldKey(field)
    if (used.has(key))
      continue
    result.push({
      key,
      label: resolveFieldLabel(field),
      isShow: field.table !== false && field.table?.isShow !== false,
    })
  }

  return result
}

/**
 * 按列设置应用顺序与显隐（支持多级表头）
 * - 叶子按设置排序 / 显隐
 * - 分组列保留结构，无可见子列时整组去掉
 * - actions 始终在末尾
 */
export function applyColSetting(
  fields: UnifiedFieldConfig[],
  setting: ColSettingItem[],
): UnifiedFieldConfig[] {
  const orderIndex = new Map(setting.map((item, i) => [item.key, i]))
  const showMap = new Map(setting.map(item => [item.key, item.isShow !== false]))

  function leafOrder(field: UnifiedFieldConfig): number {
    const kids = field.children?.filter(f => isFieldInScene(f, 'table')) ?? []
    if (kids.length) {
      const orders = kids.map(leafOrder).filter(n => Number.isFinite(n))
      return orders.length ? Math.min(...orders) : Number.POSITIVE_INFINITY
    }
    return orderIndex.get(resolveFieldKey(field)) ?? Number.POSITIVE_INFINITY
  }

  function isLeafVisible(field: UnifiedFieldConfig): boolean {
    if (isActionsField(field))
      return true
    if (!isColSettingField(field))
      return true
    return showMap.get(resolveFieldKey(field)) !== false
  }

  function transform(list: UnifiedFieldConfig[]): UnifiedFieldConfig[] {
    const next: UnifiedFieldConfig[] = []
    for (const field of list) {
      if (!isFieldInScene(field, 'table'))
        continue
      const kids = field.children?.filter(f => isFieldInScene(f, 'table')) ?? []
      if (kids.length) {
        const children = transform(kids)
        if (!children.length)
          continue
        next.push({ ...field, children })
        continue
      }
      if (!isLeafVisible(field))
        continue
      next.push(field)
    }

    const actions = next.filter(isActionsField)
    const others = next.filter(f => !isActionsField(f))
    others.sort((a, b) => leafOrder(a) - leafOrder(b))
    return [...others, ...actions]
  }

  return transform(fields)
}

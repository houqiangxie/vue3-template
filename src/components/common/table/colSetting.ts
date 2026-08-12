import type { UnifiedFieldConfig } from './fieldSchema'
import { isFieldInScene } from './fieldSchema'
import type { ColSettingItem } from './types'

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

/** 是否可参与列设置（显隐 / 排序） */
export function isColSettingField(field: UnifiedFieldConfig): boolean {
  if (!isFieldInScene(field, 'table'))
    return false
  if (isActionsField(field))
    return false
  const table = field.table === false ? undefined : field.table
  if (table?.hideInSetting || table?.isHede)
    return false
  return true
}

/** 读取本地列设置 */
export function loadColSetting(storageKey: string): ColSettingItem[] | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`)
    if (!raw)
      return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as ColSettingItem[] : null
  }
  catch {
    return null
  }
}

/** 保存本地列设置 */
export function saveColSetting(storageKey: string, items: ColSettingItem[]) {
  localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(items))
}

/** 清除本地列设置 */
export function clearColSetting(storageKey: string) {
  localStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`)
}

/** 根据当前 fields 构建列设置列表（合并本地缓存的顺序与显隐） */
export function buildColSettingItems(
  fields: UnifiedFieldConfig[],
  storageKey?: string,
): ColSettingItem[] {
  const configurable = fields.filter(isColSettingField)
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
 * 按列设置应用顺序与显隐
 * - selection / actions 等特殊列保持原位（actions 始终在末尾）
 * - 未出现在设置中的新字段追加到可配置列末尾
 */
export function applyColSetting(
  fields: UnifiedFieldConfig[],
  setting: ColSettingItem[],
): UnifiedFieldConfig[] {
  const tableFields = fields.filter(f => isFieldInScene(f, 'table'))
  const actionFields = tableFields.filter(isActionsField)
  const otherFields = tableFields.filter(f => !isActionsField(f))
  const settingFields = otherFields.filter(isColSettingField)
  const fixedFields = otherFields.filter(f => !isColSettingField(f))

  const fieldMap = new Map(settingFields.map(f => [resolveFieldKey(f), f]))
  const ordered: UnifiedFieldConfig[] = [...fixedFields]
  const used = new Set<string>()

  for (const item of setting) {
    const field = fieldMap.get(item.key)
    if (!field)
      continue
    used.add(item.key)
    if (item.isShow === false)
      continue
    ordered.push(field)
  }

  for (const field of settingFields) {
    const key = resolveFieldKey(field)
    if (used.has(key))
      continue
    ordered.push(field)
  }

  return [...ordered, ...actionFields]
}

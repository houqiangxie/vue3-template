/**
 * 通用工具
 */
export const deepClone = (target: unknown): unknown => {
  if (target && typeof target === 'object') {
    const result: Record<string, unknown> | unknown[] = Array.isArray(target) ? [] : {}
    for (const key in target as Record<string, unknown>) {
      const value = (target as Record<string, unknown>)[key]
      if (typeof value === 'object')
        (result as Record<string, unknown>)[key] = deepClone(value)
      else
        (result as Record<string, unknown>)[key] = value
    }
    return result
  }
  return target
}

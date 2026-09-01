/** 简单占位符替换：{name} → params.name */
export function interpolate(text: string, params?: Record<string, unknown>): string {
  if (!params)
    return text
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = params[key]
    return val == null ? `{${key}}` : String(val)
  })
}

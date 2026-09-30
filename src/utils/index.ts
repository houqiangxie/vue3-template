/** 仅保留本文件独有导出；其余 util 由各文件 / AutoImport 提供，避免 barrel 与源文件重复扫描。 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID()
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

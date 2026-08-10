import { local } from 'ux-web-storage'

const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'jfif', 'heic', 'heif', 'ico', 'dpg',
])

const OFFICE_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx'] as const
const OFFICE_UPLOAD_EXTENSIONS = [...OFFICE_EXTENSIONS, 'ppt', 'pptx'] as const

/** 文件类型预设：支持 img / office / pdf，也可单独传后缀如 png、docx */
export const FILE_TYPE_PRESETS: Record<string, { extensions: readonly string[], label: string }> = {
  img: { extensions: [...IMAGE_EXTENSIONS], label: '图片' },
  image: { extensions: [...IMAGE_EXTENSIONS], label: '图片' },
  /** 可预览的 office（不含 ppt，预览资源已剔除以减小体积） */
  office: { extensions: OFFICE_EXTENSIONS, label: 'Office办公文件' },
  /** 允许上传含 ppt/pptx，预览时可能不支持 */
  'office-all': { extensions: OFFICE_UPLOAD_EXTENSIONS, label: 'Office办公文件' },
  pdf: { extensions: ['pdf'], label: 'PDF' },
}

/** 与 fetch.ts 对齐的鉴权头（勿把 token 放进 URL query） */
export function getAuthHeaders(): Record<string, string> {
  const token = String((local as { token?: { token?: string } }).token?.token || '')
  if (!token)
    return {}
  return { token, Authorization: token }
}

export function normalizeExtension(ext: string): string {
  return ext.toLowerCase().replace(/^\./, '')
}

/** 将逗号分隔的 fileType 配置解析为 token 列表 */
export function parseFileTypeProp(value?: string | null): string[] {
  if (!value?.trim())
    return []
  return value.split(',').map(part => part.trim()).filter(Boolean)
}

/** 将预设与后缀混合配置解析为去重后的后缀列表 */
export function resolveFileTypes(types: string[] | string): string[] {
  const list = typeof types === 'string' ? parseFileTypeProp(types) : types
  const result = new Set<string>()
  for (const type of list) {
    const preset = FILE_TYPE_PRESETS[normalizeExtension(type)]
    if (preset)
      preset.extensions.forEach(ext => result.add(ext))
    else
      result.add(normalizeExtension(type))
  }
  return [...result]
}

/** 提示文案：预设显示中文名称，单独后缀原样展示 */
export function formatFileTypeTip(types: string[] | string): string {
  const list = typeof types === 'string' ? parseFileTypeProp(types) : types
  return list.map((type) => {
    const preset = FILE_TYPE_PRESETS[normalizeExtension(type)]
    return preset ? preset.label : normalizeExtension(type)
  }).join(',')
}

export function isImageExtension(ext: string): boolean {
  return IMAGE_EXTENSIONS.has(normalizeExtension(ext))
}

export function isImageOnlyTypes(fileTypes: string[]): boolean {
  if (!fileTypes.length)
    return false
  return fileTypes.every(type => isImageExtension(type))
}

export function isImageFileName(name?: string | null): boolean {
  if (!name)
    return false
  const ext = name.split('.').pop()
  return ext ? isImageExtension(ext) : false
}

/**
 * 将 fileId / 相对路径转为可访问 URL。
 * 不附带 token（避免进日志 / Referer）；需鉴权时用 fetchPreviewFile 或带 getAuthHeaders 的请求。
 */
export function formatFileUrl(url?: string | null, isVideo = false, isPublic: boolean = true): string {
  if (!url)
    return ''
  if (/^(https?:|blob:|data:)/i.test(url) || url.includes('sys'))
    return url

  const base = (import.meta.env.VITE_baseUrl || '').replace(/\/$/, '')
  const action = isVideo
    ? 'public/previewMinioVideo'
    : isPublic
      ? 'public/previewFile'
      : 'preview'
  return `${base}/system/sys/file/${action}?fileId=${encodeURIComponent(url)}`
}

export interface UploadedFileItem {
  name?: string
  fileName?: string
  url?: string
  fileUrl?: string
  fileId?: string
  filePath?: string
  fileSize?: number
  fileType?: string
  type?: string | number
  uid?: string | number
}

export function resolveFileId(item: UploadedFileItem): string {
  return item.fileId || item.filePath || item.url || item.fileUrl || ''
}

export function resolveFileName(item: UploadedFileItem): string {
  return item.name || item.fileName || resolveFileId(item)
}

/** 接口返回 attachment 头时，先 fetch 成 File 再交给预览器 */
export async function fetchPreviewFile(url: string, filename: string): Promise<File> {
  const headers = getAuthHeaders()
  if (!headers.token)
    throw new Error('未登录，无法加载文件')

  const response = await fetch(url, { headers })
  if (!response.ok)
    throw new Error(`文件加载失败 (${response.status})`)

  const blob = await response.blob()
  const name = filename?.trim() || 'file'
  return new File([blob], name, { type: blob.type || undefined })
}

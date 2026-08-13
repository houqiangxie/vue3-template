import { saveAs } from 'file-saver'
import { local } from 'ux-web-storage'
import { toQueryString } from '@/utils/fetch'

function parseFilename(disposition: string | null): string | undefined {
  if (!disposition)
    return undefined
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (utf8?.[1])
    return decodeURIComponent(utf8[1].trim().replace(/["']/g, ''))
  const plain = /filename=([^;]+)/i.exec(disposition)
  if (plain?.[1])
    return plain[1].trim().replace(/["']/g, '')
  return undefined
}

async function readBlobAsError(blob: Blob): Promise<string | null> {
  if (!blob.type.includes('json') && !blob.type.includes('text'))
    return null
  try {
    const text = await blob.text()
    const json = JSON.parse(text) as { code?: number, message?: string, msg?: string }
    if (json && typeof json === 'object' && json.code !== undefined && json.code !== 0)
      return json.message || json.msg || '下载失败'
  }
  catch {
    // ignore
  }
  return null
}

export interface DownloadOptions {
  /** 查询参数（GET）或 body（POST） */
  params?: Record<string, unknown>
  /** 默认 GET */
  method?: 'GET' | 'POST'
  /** 保存文件名；缺省时尝试 Content-Disposition */
  filename?: string
  /** 是否显示全局 loading，默认 true */
  showLoading?: boolean
}

/**
 * 文件流下载（blob）
 */
export function useDownload() {
  const downloading = ref(false)

  async function download(url: string, options: DownloadOptions = {}) {
    const {
      params = {},
      method = 'GET',
      filename,
      showLoading = true,
    } = options

    const token = (local as { token?: { token?: string } }).token?.token
    const base = String(import.meta.env.VITE_baseUrl || '')
    const qs = method === 'GET' ? toQueryString(params) : ''
    const fullUrl = `${base}${url}${qs ? `?${qs}` : ''}`

    downloading.value = true
    if (showLoading)
      useLoadingStore().setLoading(true)

    try {
      const res = await fetch(fullUrl, {
        method,
        headers: {
          ...(token ? { token, Authorization: token } : {}),
          ...(method === 'POST' ? { 'Content-Type': 'application/json;charset=utf-8' } : {}),
        },
        body: method === 'POST' ? JSON.stringify(params) : undefined,
      })

      if (res.status === 401) {
        window.$message?.error('未登录或登录已过期')
        throw new Error('unauthorized')
      }

      const blob = await res.blob()
      const errMsg = await readBlobAsError(blob)
      if (errMsg) {
        window.$message?.error(errMsg)
        throw new Error(errMsg)
      }

      const name = filename || parseFilename(res.headers.get('content-disposition')) || 'download'
      saveAs(blob, name)
    }
    finally {
      downloading.value = false
      if (showLoading)
        useLoadingStore().setLoading(false)
    }
  }

  return { downloading, download }
}

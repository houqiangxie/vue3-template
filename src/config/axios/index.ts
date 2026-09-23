/**
 * BPM 入口用的请求适配层：对齐芋道 `@/config/axios` 接口形态，
 * 底层走本仓库 `utils/fetch`，便于直接复用 flowable 的 api/bpm。
 */
import { del, get as httpGet, post as httpPost, put as httpPut } from '@/utils/fetch'

type Option = {
  url: string
  params?: Record<string, unknown>
  data?: unknown
  headersType?: string
  headers?: Record<string, string>
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer'
}

async function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
  const res = await promise
  return res.data as T
}

const request = {
  get: async <T = unknown>(option: Option) => {
    return unwrap<T>(httpGet<T>(option.url, option.params, {
      headers: option.headers,
      responseType: option.responseType,
    }))
  },
  post: async <T = unknown>(option: Option) => {
    return unwrap<T>(httpPost<T>(option.url, option.data as Record<string, unknown>, {
      headers: option.headers,
      formData: option.headersType === 'multipart/form-data',
      responseType: option.responseType,
    }))
  },
  put: async <T = unknown>(option: Option) => {
    let url = option.url
    if (option.params && Object.keys(option.params).length) {
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(option.params)) {
        if (v != null && v !== '')
          qs.append(k, String(v))
      }
      const s = qs.toString()
      if (s)
        url += (url.includes('?') ? '&' : '?') + s
    }
    return unwrap<T>(httpPut<T>(url, (option.data ?? {}) as Record<string, unknown>, {
      headers: option.headers,
      responseType: option.responseType,
    }))
  },
  delete: async <T = unknown>(option: Option) => {
    // 芋道风格：cancel 等接口用 @RequestParam，params 必须拼到 URL；body 仅在显式传 data 时使用（如减签）
    let url = option.url
    if (option.params && Object.keys(option.params).length) {
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(option.params)) {
        if (v != null && v !== '')
          qs.append(k, String(v))
      }
      const s = qs.toString()
      if (s)
        url += (url.includes('?') ? '&' : '?') + s
    }
    return unwrap<T>(del<T>(url, (option.data ?? {}) as Record<string, unknown>, {
      headers: option.headers,
      responseType: option.responseType,
    }))
  },
  download: async (option: Option) => {
    return httpGet(option.url, option.params, {
      responseType: 'blob',
      returnOrigin: true,
      withoutCheck: true,
    })
  },
  upload: async <T = unknown>(option: Option) => {
    return unwrap<T>(httpPost<T>(option.url, option.data as Record<string, unknown>, {
      fileUpload: true,
      formData: true,
    }))
  },
}

export default request

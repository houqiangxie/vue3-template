import { db, local } from 'ux-web-storage'
import { showRequestError } from '@/utils/toast'
import { deepClone } from '@/utils/common'

export interface RequestConfig {
  withoutCheck?: boolean
  returnOrigin?: boolean
  showError?: boolean
  canEmpty?: boolean
  timeout?: number
  mode?: RequestMode
  cache?: RequestCache
  cached?: boolean
  catchExpires?: number | null
  last?: boolean
  hideLoading?: boolean
  formData?: boolean
  fileUpload?: boolean
  joinUrl?: boolean
  unwanted?: boolean
  isNotAuth?: boolean
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer'
  requestKey?: string
  headers?: Record<string, string>
  [key: string]: unknown
}

export interface ApiResponse<T = unknown> {
  data: T
  code: number
  message?: string
  msg?: string
}

/** 业务/网络错误；shown=true 表示已弹过 toast，调用方勿重复提示 */
export class ApiError extends Error {
  code: number
  shown: boolean
  raw?: unknown

  constructor(message: string, code = -1, shown = false, raw?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.shown = shown
    this.raw = raw
  }
}

window.addEventListener('unhandledrejection', (e) => {
  // 仅吞掉已由 ApiError 提示过的业务拒绝，避免控制台噪音；其余仍抛出
  const reason = e.reason
  if (reason instanceof ApiError && reason.shown)
    e.preventDefault()
})

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface PendingConfig extends RequestConfig {
  method: string
  url: string
  body: unknown
  headers: Record<string, string>
  controller: AbortController
  abortRequest?: boolean
  /** 主动取消 vs 超时，catch 里区分提示 */
  abortReason?: 'cancel' | 'timeout'
  timeoutId?: ReturnType<typeof setTimeout>
  signal: AbortSignal
}

const configDefault: RequestConfig = {
  showError: true,
  canEmpty: false,
  returnOrigin: false,
  withoutCheck: false,
  timeout: 10000,
  mode: 'cors',
  cache: 'no-cache',
  cached: false,
  catchExpires: null,
  last: false,
}

function generateReqKey(config: { method?: string, url?: string, body?: unknown, requestKey?: string }) {
  const { method, url, body, requestKey } = config
  if (requestKey)
    return requestKey
  let bodyKey = ''
  try {
    bodyKey = body == null ? '' : typeof body === 'string' ? body : JSON.stringify(body)
  }
  catch {
    bodyKey = String(body)
  }
  return [method, url, bodyKey].join('&')
}

const pendingRequest = new Map<string, PendingConfig>()
const cacheRequestMap = new Map<string, Promise<ApiResponse>>()

export const addPendingRequest = (config: PendingConfig) => {
  const requestKey = generateReqKey(config)
  if (config.last && pendingRequest.has(requestKey)) {
    removePendingRequest(config, requestKey)
    cacheRequestMap.delete(requestKey)
  }
  if (!pendingRequest.has(requestKey))
    pendingRequest.set(requestKey, config)
}

function clearRequestTimeout(config: PendingConfig) {
  if (config.timeoutId != null) {
    clearTimeout(config.timeoutId)
    config.timeoutId = undefined
  }
}

/** 仅清理 pending/timeout，不 abort（请求正常结束时用） */
function clearPendingRequest(requestKey: string) {
  const pending = pendingRequest.get(requestKey)
  if (pending)
    clearRequestTimeout(pending)
  pendingRequest.delete(requestKey)
  cacheRequestMap.delete(requestKey)
}

/** 主动取消：abort + 清理。务必取 Map 里的旧请求，避免 last 场景误 abort 新请求 */
export const removePendingRequest = (config: PendingConfig | RequestConfig, requestKey?: string) => {
  if (!requestKey)
    requestKey = generateReqKey(config as PendingConfig)
  const cancelToken = pendingRequest.get(requestKey)
  if (!cancelToken)
    return
  clearRequestTimeout(cancelToken)
  if (cancelToken.controller) {
    if (!cancelToken.abortReason)
      cancelToken.abortReason = 'cancel'
    cancelToken.abortRequest = true
    cancelToken.controller.abort()
  }
  pendingRequest.delete(requestKey)
  cacheRequestMap.delete(requestKey)
}

export const removeAllPendingRequest = () => {
  pendingRequest.forEach((source) => {
    removePendingRequest(source)
  })
  cacheRequestMap.clear()
}

async function resultReduction(response: Response, responseType = 'json') {
  switch (responseType) {
    case 'text':
      return response.text()
    case 'blob':
      return response.blob()
    case 'arrayBuffer':
      return response.arrayBuffer()
    case 'json':
    default:
      return response.json()
  }
}

/** 将对象序列化为 query string（跳过 null / undefined） */
export function toQueryString(data: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined)
      continue
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined)
          params.append(key, String(item))
      })
      continue
    }
    params.append(key, String(value))
  }
  return params.toString()
}

/** history 模式下构造登录地址，兼容 web（BASE/）与 app（BASE/app/）双入口 */
function buildLoginRedirectUrl(): string | null {
  const { pathname, search, hash } = location
  if (/\/login\/?$/.test(pathname) || /(?:^|[?&])returnUrl=/.test(search))
    return null

  const base = String(import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const appRoot = `${base}/app`
  const isApp = pathname === appRoot || pathname.startsWith(`${appRoot}/`)
  const routerBase = isApp ? `${appRoot}/` : `${base}/`

  let relative = '/'
  if (pathname.startsWith(routerBase))
    relative = `/${pathname.slice(routerBase.length)}`.replace(/\/{2,}/g, '/') || '/'
  else if (pathname === routerBase.replace(/\/$/, ''))
    relative = '/'

  const returnUrl = `${relative === '//' ? '/' : relative}${search}${hash}`
  return `${routerBase}login?returnUrl=${encodeURIComponent(returnUrl)}`
}

function redirectToLogin() {
  // 清掉本地凭证，否则守卫会因仍有 token 把 /login 再踢回首页
  try {
    delete (local as { token?: unknown }).token
  }
  catch {
    // ignore
  }

  const loginUrl = buildLoginRedirectUrl()
  if (!loginUrl)
    return

  const center = (window as Window & { eventCenterForAppEmergencyTeam?: unknown }).eventCenterForAppEmergencyTeam
  if (center) {
    const origin = location.ancestorOrigins?.[0] || ''
    parent.location.replace(origin ? new URL(loginUrl, origin).href : loginUrl)
  }
  else {
    location.href = loginUrl
  }
}

function notifyError(config: RequestConfig, message: string) {
  if (config.showError === false)
    return false
  showRequestError(message)
  return true
}

/**
 * 解包标准 ApiResponse：code===0 返回 data，否则抛 ApiError
 * 若请求层已 toast（shown），调用方 catch 后勿再弹窗
 */
export function unwrapData<T = unknown>(res: ApiResponse<T>, fallbackMsg = '请求失败'): T {
  if (res.code === 0)
    return res.data
  throw new ApiError(res.message || res.msg || fallbackMsg, res.code, false, res)
}

function buildHeaders(config: RequestConfig, token?: string): Record<string, string> {
  const headers: Record<string, string> = {}
  // fileUpload 交给浏览器自动带 boundary，不要手写 multipart Content-Type
  if (!config.fileUpload) {
    headers['Content-Type'] = config.formData
      ? 'application/x-www-form-urlencoded'
      : 'application/json;charset=utf-8'
  }
  if (token && !config.isNotAuth) {
    headers.token = token
    headers.Authorization = token
  }
  if (config.headers)
    Object.assign(headers, config.headers)
  return headers
}

function omitNullFields(data: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...data }
  for (const key of Object.keys(next)) {
    if (next[key] === null)
      delete next[key]
  }
  return next
}

async function request<T = unknown>(
  method: RequestMethod,
  path: string,
  data: Record<string, unknown> = {},
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  const loadingStore = useLoadingStore()
  const token = local.token?.token as string | undefined
  const controller = new AbortController()
  const { signal } = controller
  path = (config?.unwanted ? '' : import.meta.env.VITE_baseUrl) + path

  const configTemp: PendingConfig = {
    ...configDefault,
    ...config,
    responseType: config.responseType || 'json',
    method,
    url: path,
    body: data,
    headers: buildHeaders(config, token),
    controller,
    signal,
  }

  const requestKey = generateReqKey(configTemp)
  configTemp.requestKey = requestKey
  if (cacheRequestMap.has(requestKey))
    return cacheRequestMap.get(requestKey)! as Promise<ApiResponse<T>>

  if (!config.hideLoading)
    loadingStore.setLoading(true)
  addPendingRequest(configTemp)

  const timeoutMs = Number(configTemp.timeout)
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    configTemp.timeoutId = setTimeout(() => {
      if (!pendingRequest.has(requestKey))
        return
      configTemp.abortReason = 'timeout'
      configTemp.abortRequest = true
      controller.abort()
    }, timeoutMs)
  }

  if (config.cached) {
    const res = await db.get(requestKey)
    if (res) {
      clearPendingRequest(requestKey)
      if (!config.hideLoading)
        loadingStore.setLoading(false)
      return res as ApiResponse<T>
    }
  }

  const payload = config.fileUpload ? data : omitNullFields(data)

  let body: BodyInit | undefined
  if (method !== 'GET') {
    if (config.fileUpload)
      body = payload as unknown as BodyInit
    else if (config.formData)
      body = new URLSearchParams(payload as Record<string, string>)
    else
      body = JSON.stringify(payload)
  }

  const myInit: RequestInit = {
    method,
    mode: configTemp.mode,
    cache: configTemp.cache,
    signal,
    headers: configTemp.headers,
    body,
  }

  let params = ''
  if (!config.fileUpload && payload && typeof payload === 'object' && !Array.isArray(payload)
    && (method === 'GET' || config.joinUrl)) {
    params = toQueryString(payload as Record<string, unknown>)
  }

  const fetchPromise = new Promise<ApiResponse<T>>((resolve, reject) => {
    const url = params ? `${path}?${params}` : path
    let settled = false
    const finish = () => {
      if (settled)
        return
      settled = true
      clearPendingRequest(requestKey)
      if (!config.hideLoading)
        loadingStore.setLoading(false)
    }

    fetch(url, myInit).then(async (response) => {
      const responseType = configTemp.responseType || 'json'
      let raw: unknown
      try {
        raw = await resultReduction(response, responseType)
      }
      catch (parseError) {
        finish()
        const shown = notifyError(configTemp, '服务器异常，请稍后再试')
        return reject(new ApiError('服务器异常，请稍后再试', -1, shown, parseError))
      }

      finish()

      // blob / text / arrayBuffer：不做业务 code 解包
      if (responseType !== 'json') {
        if (response.status === 401 && !configTemp.withoutCheck) {
          redirectToLogin()
          return reject(new ApiError('未登录或登录已过期', 401, true, raw))
        }
        if (response.status >= 200 && response.status < 300)
          return resolve(raw as ApiResponse<T>)
        const shown = notifyError(configTemp, `请求失败 (${response.status})`)
        return reject(new ApiError(`请求失败 (${response.status})`, response.status, shown, raw))
      }

      const res = raw as ApiResponse<T>

      if ((response.status === 401 || res.code === 401) && !configTemp.withoutCheck) {
        redirectToLogin()
        return reject(new ApiError(res.message || res.msg || '未登录或登录已过期', 401, true, res))
      }
      if (res.code === 403)
        window.history.go(-1)

      if (configTemp.withoutCheck)
        return resolve(res)

      if (response.status >= 200 && response.status < 300) {
        // 业务失败：只 toast 一次，再 reject，避免上层再弹
        if (res.code !== 0) {
          const msg = res.code === 500
            ? '接口异常，请联系管理员!'
            : (res.message || res.msg || '请求失败')
          const shown = notifyError(configTemp, msg)
          return reject(new ApiError(msg, res.code, shown, res))
        }
        if (configTemp.cached)
          db.set(requestKey, deepClone(res), configTemp.catchExpires ?? undefined)
        return resolve(res)
      }

      const httpMsg = res.message || res.msg || `请求失败 (${response.status})`
      const shown = notifyError(configTemp, httpMsg)
      return reject(new ApiError(httpMsg, res.code ?? response.status, shown, res))
    }).catch((error) => {
      finish()
      if (error instanceof ApiError)
        return reject(error)
      if (configTemp.abortRequest) {
        if (configTemp.abortReason === 'timeout') {
          const shown = notifyError(configTemp, '请求超时，请稍后再试')
          return reject(new ApiError('请求超时，请稍后再试', -1, shown, error))
        }
        return reject(error)
      }
      const shown = notifyError(configTemp, '服务器异常，请稍后再试')
      return reject(new ApiError('服务器异常，请稍后再试', -1, shown, error))
    })
  })

  cacheRequestMap.set(requestKey, fetchPromise as Promise<ApiResponse>)
  return fetchPromise
}

export async function get<T = unknown>(path = '', data: Record<string, unknown> = {}, config: RequestConfig = {}) {
  return await request<T>('GET', path, data, config)
}

export async function post<T = unknown>(path = '', data: Record<string, unknown> = {}, config: RequestConfig = {}) {
  return await request<T>('POST', path, data, config)
}

export async function put<T = unknown>(path = '', data: Record<string, unknown> = {}, config: RequestConfig = {}) {
  return await request<T>('PUT', path, data, config)
}

export async function del<T = unknown>(path = '', data: Record<string, unknown> = {}, config: RequestConfig = {}) {
  return await request<T>('DELETE', path, data, config)
}

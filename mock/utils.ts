import type { IncomingMessage, ServerResponse } from 'node:http'

export interface MockRequest {
  method: string
  url: string
  pathname: string
  query: Record<string, string>
  params: Record<string, string>
  body: any
}

export type MockHandler = (req: MockRequest) => any | Promise<any>

export interface MockRoute {
  method: string
  /** 支持 :id 参数，如 /system/user/:userId */
  path: string
  handler: MockHandler
}

export function ok<T>(data: T, message = '操作成功') {
  return { code: 0, data, message }
}

export function pageOk<T>(rows: T[], total: number) {
  return ok({ rows, total })
}

export function fail(message: string, code = 500) {
  return { code, data: null, message }
}

export function parseQuery(url: string): Record<string, string> {
  const qIndex = url.indexOf('?')
  if (qIndex < 0)
    return {}
  const params = new URLSearchParams(url.slice(qIndex + 1))
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length)
    return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]
    const vp = pathParts[i]
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(vp)
      continue
    }
    if (pp !== vp)
      return null
  }
  return params
}

export function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      }
      catch {
        const form: Record<string, string> = {}
        new URLSearchParams(raw).forEach((value, key) => {
          form[key] = value
        })
        resolve(form)
      }
    })
    req.on('error', () => resolve({}))
  })
}

export function sendJson(res: ServerResponse, payload: unknown, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json;charset=utf-8')
  res.end(JSON.stringify(payload))
}

export function now() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

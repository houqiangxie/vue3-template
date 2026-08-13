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

/** 原始一次性响应 */
export interface MockRawPayload {
  __raw: true
  body: string | Buffer
  contentType?: string
}

/** SSE / 分片流式响应 */
export interface MockStreamPayload {
  __stream: true
  chunks: string[]
  contentType?: string
  /** 分片间隔 ms，默认 40 */
  delay?: number
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

export function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

/** 写出 SSE / NDJSON 分片流 */
export async function sendStream(res: ServerResponse, payload: MockStreamPayload, req?: IncomingMessage) {
  res.statusCode = 200
  res.setHeader('Content-Type', payload.contentType || 'text/event-stream;charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  let aborted = false
  const onClose = () => {
    aborted = true
  }
  req?.on('close', onClose)

  const delay = Number.isFinite(payload.delay) ? Math.max(0, Number(payload.delay)) : 40
  try {
    for (const chunk of payload.chunks) {
      if (aborted || res.writableEnded)
        break
      res.write(chunk)
      if (delay > 0)
        await sleep(delay)
    }
  }
  finally {
    req?.off('close', onClose)
    if (!res.writableEnded)
      res.end()
  }
}

export function now() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

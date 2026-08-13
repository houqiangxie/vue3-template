export interface FetchStreamOptions {
  url?: string
  requestInit?: RequestInit
  /**
   * 使用 Web Worker 异步解码/拆分流数据，减轻主线程压力。
   * Worker 不可用时自动回退到主线程处理。
   */
  useWorker?: boolean
  /** 收到一条已解析消息（JSON 或 { text }） */
  onmessage?: (data: Record<string, unknown>, index: number) => void
  ondone?: () => void
  onerror?: (response: unknown) => void
}

/** 流式分片解析结果（主线程 / Worker 共用） */
export interface StreamParseResult {
  rest: string
  /** 已解析的完整消息 */
  messages: Record<string, unknown>[]
  /** 收到 [DONE] 标记 */
  done: boolean
}

type FetchStreamWorkerIn
  = | { type: 'chunk', chunk: ArrayBuffer }
    | { type: 'flush' }
    | { type: 'reset' }

type FetchStreamWorkerOut
  = | { type: 'message', data: Record<string, unknown>, index: number }
    | { type: 'done' }
    | { type: 'error', message: string }

/**
 * 解析一行流数据：兼容 SSE `data:` 前缀、JSON、纯文本与 [DONE]。
 * 对齐 szsti_regulatory_enterprise_web / aiCart 的 FetchStream 行为。
 */
export function parseStreamLine(line: string): { done: boolean, data?: Record<string, unknown> } {
  let payload = line.trim()
  if (!payload)
    return { done: false }

  if (payload.startsWith('data:'))
    payload = payload.slice(5).trimStart()

  if (!payload || payload === '[DONE]')
    return { done: payload === '[DONE]' }

  try {
    const data = JSON.parse(payload) as Record<string, unknown>
    return { done: false, data: data && typeof data === 'object' ? data : { text: payload } }
  }
  catch {
    return { done: false, data: { text: payload } }
  }
}

/**
 * 增量解析流文本。
 * - 按行缓冲，末行不完整时保留在 rest
 * - 空行视为 SSE 事件分隔，直接跳过
 */
export function parseStreamText(buffer: string, chunkText: string, forceFlush = false): StreamParseResult {
  const next = buffer + chunkText
  const parts = next.split('\n')
  const rest = forceFlush ? '' : (parts.pop() || '')
  const messages: Record<string, unknown>[] = []
  let done = false

  for (const part of parts) {
    const parsed = parseStreamLine(part)
    if (parsed.done) {
      done = true
      break
    }
    if (parsed.data)
      messages.push(parsed.data)
  }

  if (forceFlush && rest.trim()) {
    const parsed = parseStreamLine(rest)
    if (parsed.done)
      done = true
    else if (parsed.data)
      messages.push(parsed.data)
  }

  return { rest: done ? '' : rest, messages, done }
}

function toTransferableBuffer(chunk: Uint8Array): ArrayBuffer {
  return chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer
}

function isAbortError(error: unknown) {
  return !!error
    && typeof error === 'object'
    && 'name' in error
    && (error as { name?: string }).name === 'AbortError'
}

/** 将解析函数与 Worker 逻辑打成 Blob，避免拆成独立 worker 文件 */
function createFetchStreamWorker(): Worker {
  const source = `
${parseStreamLine.toString()}
${parseStreamText.toString()}

let buffer = ''
let index = 0
let decoder = new TextDecoder('utf-8')
let finished = false

function resetState() {
  buffer = ''
  index = 0
  decoder = new TextDecoder('utf-8')
  finished = false
}

function emitMessages(messages) {
  for (const data of messages) {
    self.postMessage({ type: 'message', data, index: index++ })
  }
}

function emitDone() {
  if (finished)
    return
  finished = true
  self.postMessage({ type: 'done' })
}

self.onmessage = (event) => {
  try {
    const payload = event.data
    if (payload.type === 'reset') {
      resetState()
      return
    }

    if (payload.type === 'chunk') {
      if (finished)
        return
      const chunkText = decoder.decode(payload.chunk, { stream: true })
      const parsed = parseStreamText(buffer, chunkText, false)
      buffer = parsed.rest
      emitMessages(parsed.messages)
      if (parsed.done)
        emitDone()
      return
    }

    if (payload.type === 'flush') {
      if (finished)
        return
      buffer += decoder.decode(new Uint8Array(), { stream: false })
      const parsed = parseStreamText(buffer, '', true)
      buffer = ''
      emitMessages(parsed.messages)
      emitDone()
    }
  }
  catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
`
  const url = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }))
  try {
    return new Worker(url)
  }
  finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Fetch 流式读取封装。
 * 兼容 SSE `data:` / NDJSON / `[DONE]`，对齐 aiCart 用法，并支持 Worker 卸载解析。
 */
export class FetchStream {
  url = ''
  requestInit: RequestInit = {}
  useWorker = false
  onmessage: (data: Record<string, unknown>, index: number) => void = () => {}
  ondone: () => void = () => {}
  onerror: (response: unknown) => void = () => {}

  private worker: Worker | null = null
  private aborted = false
  private finished = false
  private controller: AbortController | null = null

  constructor(options: FetchStreamOptions = {}) {
    this.url = options.url || ''
    this.requestInit = options.requestInit || {}
    this.useWorker = !!options.useWorker
    this.onmessage = options.onmessage || (() => {})
    this.ondone = options.ondone || (() => {})
    this.onerror = options.onerror || (() => {})
    this.createFetchRequest()
  }

  /** 主动取消流式请求并释放 Worker */
  abort() {
    this.aborted = true
    this.controller?.abort()
    this.destroyWorker()
  }

  private markDone() {
    if (this.finished || this.aborted)
      return
    this.finished = true
    this.ondone?.()
    this.destroyWorker()
  }

  private destroyWorker() {
    if (!this.worker)
      return
    this.worker.terminate()
    this.worker = null
  }

  private ensureWorker(): Worker | null {
    if (!this.useWorker || typeof Worker === 'undefined')
      return null
    if (this.worker)
      return this.worker

    try {
      const worker = createFetchStreamWorker()
      worker.onmessage = (event: MessageEvent<FetchStreamWorkerOut>) => {
        if (this.aborted)
          return
        const payload = event.data
        if (payload.type === 'message') {
          this.onmessage(payload.data, payload.index)
          return
        }
        if (payload.type === 'done') {
          this.markDone()
          return
        }
        if (payload.type === 'error')
          this.onerror?.(new Error(payload.message))
      }
      worker.onerror = (event) => {
        if (this.aborted)
          return
        this.onerror?.(event.error || event.message || event)
        this.destroyWorker()
      }
      const reset: FetchStreamWorkerIn = { type: 'reset' }
      worker.postMessage(reset)
      this.worker = worker
      return worker
    }
    catch {
      return null
    }
  }

  private postWorkerChunk(worker: Worker, chunk: Uint8Array) {
    const buffer = toTransferableBuffer(chunk)
    const message: FetchStreamWorkerIn = { type: 'chunk', chunk: buffer }
    worker.postMessage(message, [buffer])
  }

  private async consumeWithWorker(reader: ReadableStreamDefaultReader<Uint8Array>, worker: Worker) {
    while (!this.aborted && !this.finished) {
      const { value, done } = await reader.read()
      if (done) {
        const flush: FetchStreamWorkerIn = { type: 'flush' }
        worker.postMessage(flush)
        break
      }
      if (value?.byteLength)
        this.postWorkerChunk(worker, value)
    }
  }

  private async consumeOnMainThread(reader: ReadableStreamDefaultReader<Uint8Array>) {
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let index = 0

    while (!this.aborted && !this.finished) {
      const { value, done } = await reader.read()
      if (done) {
        buffer += decoder.decode(new Uint8Array(), { stream: false })
        const parsed = parseStreamText(buffer, '', true)
        for (const data of parsed.messages)
          this.onmessage(data, index++)
        this.markDone()
        break
      }

      const chunkText = decoder.decode(value, { stream: true })
      const parsed = parseStreamText(buffer, chunkText, false)
      buffer = parsed.rest
      for (const data of parsed.messages)
        this.onmessage(data, index++)
      if (parsed.done) {
        this.markDone()
        try {
          await reader.cancel()
        }
        catch {
          // ignore
        }
        break
      }
    }
  }

  createFetchRequest() {
    this.aborted = false
    this.finished = false
    this.controller = new AbortController()
    const { signal } = this.controller
    const externalSignal = this.requestInit.signal
    if (externalSignal) {
      if (externalSignal.aborted) {
        this.controller.abort()
      }
      else {
        externalSignal.addEventListener('abort', () => this.controller?.abort(), { once: true })
      }
    }

    fetch(this.url, {
      method: 'POST',
      ...this.requestInit,
      signal,
    }).then((response) => {
      if (response.status === 200)
        return response.body
      return Promise.reject(response)
    }).then(async (readableStream) => {
      if (!readableStream || this.aborted)
        return

      const reader = readableStream.getReader()
      const worker = this.ensureWorker()
      if (worker)
        await this.consumeWithWorker(reader, worker)
      else
        await this.consumeOnMainThread(reader)
    }).catch((response) => {
      if (this.aborted || isAbortError(response))
        return
      this.destroyWorker()
      this.onerror?.(response)
    })
  }
}

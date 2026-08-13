import { local } from 'ux-web-storage'
import { FetchStream, type FetchStreamOptions } from '@/utils/fetchStream'

export interface AiChatParams {
  query: string
  taskId?: string
  appId?: string
}

export interface AiChatStreamHandlers {
  onmessage?: FetchStreamOptions['onmessage']
  ondone?: FetchStreamOptions['ondone']
  onerror?: FetchStreamOptions['onerror']
  useWorker?: boolean
  signal?: AbortSignal
}

function resolveChatUrl() {
  const custom = import.meta.env.VITE_AI_CHAT_URL as string | undefined
  if (custom)
    return custom
  return `${import.meta.env.VITE_baseUrl || ''}/ai/chat`
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json;charset=utf-8',
  }
  const token = (local as { token?: { token?: string } }).token?.token
  if (token) {
    headers.token = token
    headers.Authorization = token
  }
  return headers
}

/** 发起 AI 对话流式请求（SSE / NDJSON） */
export function createAiChatStream(params: AiChatParams, handlers: AiChatStreamHandlers = {}) {
  return new FetchStream({
    url: resolveChatUrl(),
    useWorker: handlers.useWorker ?? true,
    requestInit: {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify({
        appId: params.appId || 'ds',
        query: params.query,
        ...(params.taskId ? { taskId: params.taskId } : {}),
      }),
      signal: handlers.signal,
    },
    onmessage: handlers.onmessage,
    ondone: handlers.ondone,
    onerror: handlers.onerror,
  })
}

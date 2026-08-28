import { get } from '@/utils/fetch'
import Socket from '@/utils/websocket'
import type { AppMessage, AppMessageType } from '@/store/notification'

interface WsPayload {
  id?: string
  title?: string
  content?: string
  type?: AppMessageType
  time?: string
}

let socket: Socket | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let lastPollAt = Date.now()
let started = false
let pollingEnabled = false

function buildWsUrl(token: string): string | null {
  const envUrl = import.meta.env.VITE_WS_URL
  if (envUrl === 'false' || envUrl === '0')
    return null
  if (envUrl)
    return String(envUrl).replace('{token}', encodeURIComponent(token))

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${location.host}/ws?token=${encodeURIComponent(token)}`
}

function normalizePayload(payload: WsPayload, source: 'ws' | 'poll'): AppMessage | null {
  if (!payload.title)
    return null
  return {
    id: payload.id || `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title,
    content: payload.content,
    type: payload.type || 'notice',
    time: payload.time || new Date().toISOString(),
    read: false,
    source,
  }
}

function stopPolling() {
  pollingEnabled = false
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPolling(store: ReturnType<typeof useNotificationStore>) {
  if (pollingEnabled)
    return

  pollingEnabled = true
  store.setTransport('poll', true)

  const poll = async () => {
    try {
      const res = await get<WsPayload[]>('/message/recent', { since: lastPollAt }, {
        hideLoading: true,
        showError: false,
      })
      const list = res.data ?? []
      list.forEach((item) => {
        const msg = normalizePayload(item, 'poll')
        if (msg)
          store.pushMessage(msg)
      })
      lastPollAt = Date.now()
    }
    catch {
      // 静默失败，下一轮继续
    }
  }

  poll()
  pollTimer = setInterval(poll, 15000)
}

function stopSocket() {
  socket?.close()
  socket = null
}

function connectWebSocket(store: ReturnType<typeof useNotificationStore>, token: string) {
  const wsUrl = buildWsUrl(token)
  if (!wsUrl) {
    startPolling(store)
    return
  }

  let wsOpened = false

  socket = new Socket({
    url: wsUrl,
    callback: (data) => {
      const msg = normalizePayload(data as WsPayload, 'ws')
      if (msg)
        store.pushMessage(msg)
    },
    onOpen: () => {
      wsOpened = true
      stopPolling()
      store.setTransport('ws', true)
    },
    onClose: () => {
      if (started)
        startPolling(store)
    },
    onError: () => {
      if (!wsOpened && started) {
        stopSocket()
        startPolling(store)
      }
    },
  })

  setTimeout(() => {
    if (!wsOpened && started && !pollingEnabled) {
      stopSocket()
      startPolling(store)
    }
  }, 4000)

  socket.connect()
}

/** 登录后启动消息通道：优先 WebSocket，失败则降级轮询 */
export function startAppMessageChannel() {
  if (started)
    return

  const token = (local as { token?: { token?: string } }).token?.token
  if (!token)
    return

  started = true
  lastPollAt = Date.now()
  connectWebSocket(useNotificationStore(), token)
}

export function stopAppMessageChannel() {
  started = false
  stopPolling()
  stopSocket()
  useNotificationStore().clear()
}

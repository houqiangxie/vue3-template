export default class Socket {
  private websocket: WebSocket | null
  private isConnect: boolean
  private timer: ReturnType<typeof setTimeout> | null
  private isActivelyClose: boolean
  private param: {
    url: string
    data?: unknown
    callback?: (data: unknown) => void
  }

  constructor(param: { url: string, data?: unknown, callback?: (data: unknown) => void } = { url: '' }) {
    this.websocket = null
    this.isConnect = false
    this.timer = null
    this.isActivelyClose = false
    this.param = param
  }

  connect() {
    if (typeof WebSocket === 'undefined') {
      console.warn('[websocket] 当前环境不支持 WebSocket')
      return
    }
    this.websocket = new WebSocket(this.param.url)
    this.init(this.param)
  }

  init(param: typeof this.param) {
    if (!this.websocket)
      return

    this.isActivelyClose = false
    this.websocket.onclose = () => {
      this.isConnect = false
      if (!this.isActivelyClose)
        this.resetSocket(param)
    }
    this.websocket.onerror = () => {
      this.resetSocket(param)
    }
    this.websocket.onopen = () => {
      this.isConnect = true
      if (param.data)
        this.send(param.data)
    }
    this.websocket.onmessage = (e: MessageEvent) => {
      try {
        param.callback?.(JSON.parse(e.data))
      }
      catch {
        // ignore non-JSON payloads
      }
    }
  }

  resetSocket(param: typeof this.param) {
    if (this.isConnect)
      return false

    this.isConnect = true
    if (this.timer)
      clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.connect()
      this.isConnect = false
    }, 1000)
  }

  send(data: unknown) {
    this.websocket?.send(JSON.stringify(data))
  }

  close() {
    this.isActivelyClose = true
    this.websocket?.close()
  }
}

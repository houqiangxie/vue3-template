import type { FetchStream } from '@/utils/fetchStream'
import { createAiChatStream } from '@/api/ai/chat'

export type ChatRole = 'send' | 'receive'

export interface ChatMessage {
  id: string
  type: ChatRole
  content: string
  rawContent?: string
  query?: string
  isStreaming?: boolean
  thinkStartTime?: number | null
  thinkEndTime?: number | null
}

const REGEX_PATTERNS = {
  THINK_TAG: /<think>([\s\S]*?)<\/think>/g,
  THINK_OPEN: /<think>/g,
  THINK_CLOSE: /<\/think>/g,
  DOUBLE_NEWLINE: /\n\n/g,
  SINGLE_NEWLINE: /\n/g,
  MULTIPLE_SPACES: / {2,}/g,
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function pickChunkText(data: Record<string, unknown>) {
  const text = data.text ?? data.answer ?? data.content
  return typeof text === 'string' ? text : ''
}

/** 将原始内容格式化为可展示 HTML（含 think 块） */
export function formatChatContent(
  content: string,
  isStreaming = false,
  message?: Pick<ChatMessage, 'thinkStartTime' | 'thinkEndTime'> | null,
) {
  if (!content)
    return isStreaming ? '<span class="ai-chat__cursor">▍</span>' : ''

  const hasOpenThink = content.includes('<think>') && !content.includes('</think>')
  if (hasOpenThink) {
    const thinkStartIndex = content.lastIndexOf('<think>')
    const thinkContent = escapeHtml(content.slice(thinkStartIndex + 7))
    const beforeThink = formatPlainText(content.slice(0, thinkStartIndex))
    return `${beforeThink}<div class="ai-chat__think ai-chat__think--pending"><div class="ai-chat__think-title">思考中...</div><div class="ai-chat__think-body">${thinkContent}</div></div>`
  }

  const thinkBlocks: string[] = []
  const withPlaceholders = content.replace(REGEX_PATTERNS.THINK_TAG, (_match, thinkContent: string) => {
    const trimmed = String(thinkContent).trim()
    if (!trimmed)
      return ''
    let thinkTime = 0
    if (message?.thinkStartTime && message?.thinkEndTime)
      thinkTime = Math.round((message.thinkEndTime - message.thinkStartTime) / 1000)
    const statusText = thinkTime > 0 ? `已深度思考（用时${thinkTime}秒）` : '已深度思考'
    thinkBlocks.push(
      `<div class="ai-chat__think"><div class="ai-chat__think-title">${statusText}</div><div class="ai-chat__think-body">${escapeHtml(trimmed)}</div></div>`,
    )
    return `\u0000THINK${thinkBlocks.length - 1}\u0000`
  })

  let html = formatPlainText(withPlaceholders)
  html = html.replace(/\u0000THINK(\d+)\u0000/g, (_, idx: string) => thinkBlocks[Number(idx)] || '')
  return html + (isStreaming ? '<span class="ai-chat__cursor">▍</span>' : '')
}

function formatPlainText(text: string) {
  return escapeHtml(text)
    .replace(REGEX_PATTERNS.DOUBLE_NEWLINE, '<br/><br/>')
    .replace(REGEX_PATTERNS.SINGLE_NEWLINE, '<br/>')
    .replace(REGEX_PATTERNS.MULTIPLE_SPACES, '&nbsp;&nbsp;')
}

export function plainChatText(content = '') {
  return content
    .replace(REGEX_PATTERNS.THINK_TAG, '')
    .replace(REGEX_PATTERNS.THINK_OPEN, '')
    .replace(REGEX_PATTERNS.THINK_CLOSE, '')
    .trim()
}

export function useAiChat() {
  const messageList = ref<ChatMessage[]>([])
  const input = ref('')
  const generating = ref(false)
  const taskId = ref('')
  const messageRef = ref<HTMLElement | null>(null)

  let stream: FetchStream | null = null
  let backupQuery = ''

  function scrollToBottom(force = false) {
    nextTick(() => {
      const el = messageRef.value
      if (!el)
        return
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      if (force || distance < 48)
        el.scrollTop = el.scrollHeight
    })
  }

  function finishStreaming() {
    generating.value = false
    stream = null
    const last = messageList.value[messageList.value.length - 1]
    if (last?.type === 'receive')
      last.isStreaming = false
  }

  function stopGeneration() {
    generating.value = false
    stream?.abort()
    stream = null
    const last = messageList.value[messageList.value.length - 1]
    if (last?.type === 'receive')
      last.isStreaming = false
  }

  function sendMessage(reload = false) {
    const query = (reload ? backupQuery : input.value).trim()
    if (!query)
      return
    if (generating.value && !reload)
      return

    stream?.abort()
    stream = null
    generating.value = true

    if (!reload) {
      messageList.value.push({
        id: createId(),
        type: 'send',
        content: query,
      })
      backupQuery = query
      input.value = ''
      scrollToBottom(true)
    }

    stream = createAiChatStream(
      {
        query,
        taskId: taskId.value || undefined,
      },
      {
        onmessage: (data, index) => {
          if (!generating.value)
            return

          if (data.code === 500) {
            taskId.value = ''
            stream?.abort()
            stream = null
            const last = messageList.value[messageList.value.length - 1]
            if (last?.type === 'receive')
              messageList.value.pop()
            window.setTimeout(() => sendMessage(true), 10)
            return
          }

          if (typeof data.taskId === 'string' && data.taskId)
            taskId.value = data.taskId

          const value = pickChunkText(data)
          if (!value)
            return

          const last = messageList.value[messageList.value.length - 1]
          if (index === 0 || last?.type !== 'receive') {
            messageList.value.push({
              id: createId(),
              type: 'receive',
              content: '',
              rawContent: '',
              query,
              isStreaming: true,
              thinkStartTime: null,
              thinkEndTime: null,
            })
          }

          const current = messageList.value[messageList.value.length - 1]
          current.rawContent = (current.rawContent || '') + value
          current.content = current.rawContent
          current.isStreaming = true

          if (current.content.includes('<think>') && !current.thinkStartTime)
            current.thinkStartTime = Date.now()
          if (current.content.includes('</think>') && current.thinkStartTime && !current.thinkEndTime)
            current.thinkEndTime = Date.now()

          scrollToBottom()
        },
        ondone: () => finishStreaming(),
        onerror: () => {
          window.$message?.error('网络异常，请稍后重试')
          finishStreaming()
        },
      },
    )
  }

  function reloadMessage(message: ChatMessage, index: number) {
    if (generating.value || message.type !== 'receive')
      return
    backupQuery = message.query || backupQuery
    messageList.value = messageList.value.slice(0, index)
    sendMessage(true)
  }

  async function copyMessage(content: string) {
    const text = plainChatText(content)
    try {
      await navigator.clipboard.writeText(text)
      window.$message?.success('复制成功')
    }
    catch {
      window.$message?.error('复制失败')
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!generating.value && input.value.trim())
        sendMessage(false)
    }
  }

  onBeforeUnmount(() => {
    stream?.abort()
    stream = null
  })

  return {
    messageList,
    input,
    generating,
    messageRef,
    sendMessage,
    stopGeneration,
    reloadMessage,
    copyMessage,
    handleKeyDown,
    formatChatContent,
  }
}

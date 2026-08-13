import type { MockRoute, MockStreamPayload } from '../utils'

function sseData(payload: Record<string, unknown>) {
  return `data: ${JSON.stringify(payload)}\n\n`
}

function buildReplyChunks(query: string, taskId: string): string[] {
  const thinkParts = [
    '先理解问题要点…',
    '整理可执行的回答结构…',
  ]
  const answer = [
    `已收到你的问题：${query || '（空）'}。`,
    '',
    '这是本地 Mock 流式回复，可用于验证：',
    '1. SSE `data:` 分片解析',
    '2. Worker / 主线程双路径',
    '3. 停止生成、重新生成与复制',
    '',
    '对接真实模型时，将请求指向后端 AI 接口即可。',
  ].join('\n')

  const chunks: string[] = [
    sseData({ taskId, text: '<think>' }),
  ]

  for (const part of thinkParts)
    chunks.push(sseData({ taskId, text: part }))

  chunks.push(sseData({ taskId, text: '</think>\n' }))

  // 按短分片输出，模拟 token 流
  const step = 8
  for (let i = 0; i < answer.length; i += step)
    chunks.push(sseData({ taskId, text: answer.slice(i, i + step) }))

  chunks.push('data: [DONE]\n\n')
  return chunks
}

export const aiRoutes: MockRoute[] = [
  {
    method: 'POST',
    path: '/ai/chat',
    handler: (req): MockStreamPayload => {
      const query = String(req.body?.query || '').trim()
      const taskId = String(req.body?.taskId || `mock-${Date.now()}`)
      return {
        __stream: true,
        delay: 36,
        contentType: 'text/event-stream;charset=utf-8',
        chunks: buildReplyChunks(query, taskId),
      }
    },
  },
]

import type { MockRoute } from '../utils'
import { ok } from '../utils'

interface PushMessage {
  id: string
  title: string
  content?: string
  type: 'notice' | 'system' | 'warning'
  time: string
}

const pushMessages: PushMessage[] = [
  {
    id: 'seed-1',
    title: '欢迎使用 Vue3 Template',
    content: '系统消息通道已就绪，WebSocket 或轮询均可接收推送。',
    type: 'system',
    time: new Date().toISOString(),
  },
]

let pushSeq = 1

function maybePushRandom() {
  if (Math.random() > 0.35)
    return

  const titles = ['新用户注册', '定时任务执行完成', '系统备份成功', '在线用户变更']
  pushMessages.unshift({
    id: `mock-${Date.now()}-${pushSeq++}`,
    title: titles[Math.floor(Math.random() * titles.length)]!,
    content: '这是一条 Mock 模拟推送消息。',
    type: Math.random() > 0.7 ? 'warning' : 'notice',
    time: new Date().toISOString(),
  })
  if (pushMessages.length > 30)
    pushMessages.length = 30
}

export const messageRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/message/recent',
    handler: (req) => {
      const since = Number(req.query.since || 0)
      maybePushRandom()
      const list = pushMessages.filter(m => new Date(m.time).getTime() > since)
      return ok(list)
    },
  },
]

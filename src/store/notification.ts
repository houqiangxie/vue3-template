export type AppMessageType = 'notice' | 'system' | 'warning'

export interface AppMessage {
  id: string
  title: string
  content?: string
  type: AppMessageType
  time: string
  read: boolean
  source: 'ws' | 'poll'
}

export const useNotificationStore = defineStore('notification', () => {
  const messages = ref<AppMessage[]>([])
  const connected = ref(false)
  const transport = ref<'ws' | 'poll' | 'off'>('off')

  const unreadCount = computed(() => messages.value.filter(m => !m.read).length)

  function pushMessage(input: Omit<AppMessage, 'read'> & { read?: boolean }) {
    if (messages.value.some(m => m.id === input.id))
      return

    messages.value.unshift({
      ...input,
      read: input.read ?? false,
    })
    if (messages.value.length > 50)
      messages.value.length = 50

    window.$notification?.info({
      title: input.title,
      content: input.content || undefined,
      duration: 4500,
    })
  }

  function markAllRead() {
    messages.value.forEach((m) => {
      m.read = true
    })
  }

  function markRead(id: string) {
    const item = messages.value.find(m => m.id === id)
    if (item)
      item.read = true
  }

  function clear() {
    messages.value = []
    connected.value = false
    transport.value = 'off'
  }

  function setTransport(value: 'ws' | 'poll' | 'off', isConnected = value !== 'off') {
    transport.value = value
    connected.value = isConnected
  }

  return {
    messages,
    connected,
    transport,
    unreadCount,
    pushMessage,
    markAllRead,
    markRead,
    clear,
    setTransport,
  }
})

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID()
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export * from './is'
export * from './tree'
export * from './formatTime'
export * from './download'
export * from './constants'
export * from './dict'

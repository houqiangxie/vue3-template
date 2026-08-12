/**
 * 防抖 / 节流
 */
export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  wait = 300,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined

  onScopeDispose(() => {
    if (timer)
      clearTimeout(timer)
  })

  return (...args: Parameters<T>) => {
    if (timer)
      clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn(...args)
    }, wait)
  }
}

export function useThrottleFn<T extends (...args: any[]) => any>(
  fn: T,
  wait = 300,
): (...args: Parameters<T>) => void {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  onScopeDispose(() => {
    if (timer)
      clearTimeout(timer)
  })

  return (...args: Parameters<T>) => {
    const now = Date.now()
    const remain = wait - (now - last)
    if (remain <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      last = now
      fn(...args)
      return
    }
    if (!timer) {
      timer = setTimeout(() => {
        last = Date.now()
        timer = undefined
        fn(...args)
      }, remain)
    }
  }
}

import type { Ref } from 'vue'

/**
 * SearchPanel 折叠行高测量与展开状态
 */
export function useSearchPanelCollapse(options: {
  fieldsRef: Ref<HTMLElement | undefined>
  fieldCount: Ref<number> | (() => number)
  alwaysExpanded: Ref<boolean> | (() => boolean)
  showToggle: Ref<boolean> | (() => boolean)
}) {
  const expanded = ref(false)
  const oneRowHeight = ref(50)
  const isMeasuring = ref(false)
  let measureRetry = 0

  function resolve<T>(value: Ref<T> | (() => T)): T {
    return typeof value === 'function' ? (value as () => T)() : value.value
  }

  async function measureRowHeight() {
    await nextTick()
    const el = options.fieldsRef.value
    if (!el || !resolve(options.fieldCount))
      return

    isMeasuring.value = true
    await nextTick()

    const firstItem = el.querySelector('.search-field-wrap') as HTMLElement | null
      ?? el.querySelector('.search-field-item') as HTMLElement | null
    if (firstItem)
      oneRowHeight.value = firstItem.offsetHeight || 50

    if (oneRowHeight.value === 0 && measureRetry < 3) {
      measureRetry++
      isMeasuring.value = false
      requestAnimationFrame(() => measureRowHeight())
      return
    }
    measureRetry = 0
    isMeasuring.value = false
  }

  function toggleExpand() {
    if (resolve(options.alwaysExpanded))
      return
    expanded.value = !expanded.value
  }

  const isCollapsedLayout = computed(() =>
    !resolve(options.alwaysExpanded) && !expanded.value,
  )

  return {
    expanded,
    oneRowHeight,
    isMeasuring,
    isCollapsedLayout,
    measureRowHeight,
    toggleExpand,
  }
}

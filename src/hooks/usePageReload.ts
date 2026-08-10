import { computed, nextTick, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useTabsViewStore } from '@/store/modules/tabsView'

/** 按 fullPath 记录刷新代数，改变 key 即可重挂载，无需 /redirect */
const refreshKeys = reactive<Record<string, number>>({})

/**
 * 页面刷新（兼容 hash / history）：
 * 不修改地址栏，仅让当前页 component key 变化以脱离 keep-alive 缓存并重新挂载。
 * 对齐 guanweb：刷新时先从 cachedViews 剔除再写回，确保真正重建。
 */
export function usePageReload() {
  const route = useRoute()
  const tabsViewStore = useTabsViewStore()

  const viewKey = computed(() => {
    const path = route.fullPath
    return `${path}__${refreshKeys[path] || 0}`
  })

  async function reloadPage() {
    const path = route.fullPath
    if (!path)
      return

    const name = route.name ? String(route.name) : ''
    const needCache = !!(name && route.meta?.keepAlive)

    if (needCache)
      tabsViewStore.removeCachedView(name, true)

    await nextTick()
    refreshKeys[path] = (refreshKeys[path] || 0) + 1

    if (needCache) {
      await nextTick()
      tabsViewStore.addCachedView(name)
    }
  }

  return { viewKey, reloadPage }
}

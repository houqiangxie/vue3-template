import { computed, nextTick, reactive, ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useRoute } from 'vue-router'
import { TAB_VIEW_QUERY_KEY } from '@/components/TabView/constants'

/** 按稳定 path 记录刷新代数，改变 key 即可重挂载，无需 /redirect */
const refreshKeys = reactive<Record<string, number>>({})

/**
 * 正在刷新的路由 name。
 * Main 的 cachedNames 必须排除它，否则 removeCachedView 会被「当前页强制 include」立刻加回。
 */
const reloadingName = ref<string | null>(null)

/**
 * 刷新时先卸掉整页 vnode，再挂上。
 * 保证 NModal / NSelect / DatePicker 等 teleport 类组件整棵子树一起销毁重建，
 * 而不是只给某个封装组件打补丁。
 */
const pageAlive = ref(true)

/**
 * 生成页面 identity key：保留业务 query，剥离 TabView 的 `_tab`。
 * 否则切页内 tab（?_tab=）会改 fullPath → Main 重挂载整页闪一下。
 */
function getStableViewPath(route: RouteLocationNormalizedLoaded): string {
  const entries = Object.entries(route.query).filter(([key, value]) => {
    if (key === TAB_VIEW_QUERY_KEY)
      return false
    return value != null && value !== ''
  })
  if (!entries.length)
    return route.path

  const qs = entries
    .flatMap(([key, value]) => {
      const list = Array.isArray(value) ? value : [value]
      return list
        .filter((v): v is string => v != null && v !== '')
        .map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
    })
    .join('&')

  return qs ? `${route.path}?${qs}` : route.path
}

/**
 * 页面刷新（兼容 hash / history）：
 * 不改地址栏；踢出 keep-alive → 卸页 → 改 key → 再挂回，整页只重建一次。
 * 切 TabView 页内 tab 不 bump key，避免整页闪烁。
 */
export function usePageReload() {
  const route = useRoute()
  const tabsViewStore = useTabsViewStore()

  const viewKey = computed(() => {
    const path = getStableViewPath(route)
    return `${path}__${refreshKeys[path] || 0}`
  })

  async function reloadPage() {
    const path = getStableViewPath(route)
    if (!path)
      return

    const name = route.name ? String(route.name) : ''
    const needCache = !!(name && route.meta?.keepAlive)

    if (needCache) {
      reloadingName.value = name
      tabsViewStore.removeCachedView(name, true)
    }

    pageAlive.value = false
    await nextTick()

    refreshKeys[path] = (refreshKeys[path] || 0) + 1
    pageAlive.value = true

    if (needCache) {
      await nextTick()
      reloadingName.value = null
      tabsViewStore.addCachedView(name)
    }
  }

  return { viewKey, reloadPage, reloadingName, pageAlive }
}

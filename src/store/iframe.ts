import { defineStore } from 'pinia'

/**
 * iframe 桥接态：面包屑覆盖等。
 * 宿主页写入，Header 等消费。
 * 多 iframe DOM 复用由路由 keepAlive 负责，不在此缓存键。
 */
export const useIframeStore = defineStore('iframe', () => {
  /** 子应用上报的面包屑文案；null 表示不覆盖主应用默认面包屑 */
  const overrideBreadcrumbs = ref<string[] | null>(null)

  /** 当前激活的宿主路由 name（用于离开时清理面包屑） */
  const activeHostRouteName = ref<string | null>(null)

  function setBreadcrumbs(items: string[] | null, hostRouteName?: string) {
    overrideBreadcrumbs.value = items?.length ? [...items] : null
    if (hostRouteName != null)
      activeHostRouteName.value = hostRouteName
  }

  function clearBreadcrumbs(hostRouteName?: string) {
    if (hostRouteName && activeHostRouteName.value && hostRouteName !== activeHostRouteName.value)
      return
    overrideBreadcrumbs.value = null
    activeHostRouteName.value = null
  }

  return {
    overrideBreadcrumbs,
    activeHostRouteName,
    setBreadcrumbs,
    clearBreadcrumbs,
  }
})

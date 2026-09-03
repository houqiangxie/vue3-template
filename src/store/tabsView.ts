import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

// 不需要出现在标签页中的路由
const whiteList = ['Login', 'ErrorPage', 'LayoutRedirect', 'CatchAll', 'StaticCatchAll']

export type RouteItem = Partial<RouteLocationNormalized> & {
  fullPath: string
  path: string
  name: string
  hash: string
  meta: Record<string, unknown>
  params: object
  query: object
}

export type ITabsViewState = {
  tabsList: RouteItem[]
  /** 当前应 keep-alive 的组件名（随标签开闭同步） */
  cachedViews: string[]
}

function retainAffixRoute(list: RouteItem[]) {
  return list.filter(item => item?.meta?.affix ?? false)
}

function isKeepAliveTab(route: RouteItem): boolean {
  return !!(route.name && route.meta?.keepAlive)
}

export const useTabsViewStore = defineStore('app-tabs-view', {
  state: (): ITabsViewState => ({
    tabsList: [],
    cachedViews: [],
  }),
  getters: {},
  actions: {
    syncCachedViews() {
      const names = this.tabsList
        .filter(isKeepAliveTab)
        .map(item => String(item.name))
      this.cachedViews = [...new Set(names)]
    },

    addCachedView(name?: string | null) {
      if (!name)
        return
      const key = String(name)
      if (!this.cachedViews.includes(key))
        this.cachedViews.push(key)
    },

    /**
     * @param force 刷新当前页时为 true，即使标签仍打开也先踢出缓存
     */
    removeCachedView(name?: string | null, force = false) {
      if (!name)
        return
      const key = String(name)
      if (!force) {
        const stillOpen = this.tabsList.some(item => item.name === key)
        if (stillOpen)
          return
      }
      this.cachedViews = this.cachedViews.filter(n => n !== key)
    },

    clearCachedViews() {
      this.cachedViews = []
    },

    resetTabs() {
      this.tabsList = []
      this.cachedViews = []
    },

    /**
     * 按当前已注册路由过滤标签（换账号 / 权限变更后去掉无权限页）
     */
    filterAccessibleTabs(isAccessible: (tab: RouteItem) => boolean) {
      this.tabsList = this.tabsList.filter(
        item => !!item?.meta?.affix || isAccessible(item),
      )
      // affix 也必须有权限，否则仍可能点进无权限页
      this.tabsList = this.tabsList.filter(isAccessible)
      this.syncCachedViews()
    },

    initTabs(routes: RouteItem[]) {
      const uniqueTabs: RouteItem[] = []
      const seen = new Set<string>()

      routes.forEach((route) => {
        if (!route.name || whiteList.includes(route.name))
          return

        const isSingleton = ['控制台', '首页', '主页'].includes(route.meta?.title as string)
        const key = isSingleton ? `title:${route.meta?.title}` : `name:${route.name}`

        if (!seen.has(key)) {
          seen.add(key)
          uniqueTabs.push(route)
        }
      })

      this.tabsList = uniqueTabs
      this.syncCachedViews()
    },

    addTab(route: RouteItem): boolean {
      if (!route.name || whiteList.includes(route.name) || !route.meta?.title)
        return false

      const isSingleton = ['控制台', '首页', '主页'].includes(route.meta.title as string)

      const isExists = this.tabsList.some((item) => {
        if (isSingleton && item.meta?.title === route.meta.title)
          return true
        return item.name === route.name
      })

      if (!isExists) {
        this.tabsList.push(route)
      }
      else {
        const index = this.tabsList.findIndex((item) => {
          if (isSingleton && item.meta?.title === route.meta.title)
            return true
          return item.name === route.name
        })
        if (index !== -1)
          this.tabsList[index] = { ...this.tabsList[index], ...route }
      }

      if (isKeepAliveTab(route))
        this.addCachedView(route.name)

      return true
    },

    closeLeftTabs(route: RouteItem) {
      const index = this.tabsList.findIndex(item => item.fullPath === route.fullPath)
      this.tabsList = this.tabsList.filter(
        (item, i) => i >= index || !!item?.meta?.affix,
      )
      this.syncCachedViews()
    },

    closeRightTabs(route: RouteItem) {
      const index = this.tabsList.findIndex(item => item.fullPath === route.fullPath)
      this.tabsList = this.tabsList.filter(
        (item, i) => i <= index || !!item?.meta?.affix,
      )
      this.syncCachedViews()
    },

    closeOtherTabs(route: RouteItem) {
      this.tabsList = this.tabsList.filter(
        item => item.fullPath === route.fullPath || !!item?.meta?.affix,
      )
      this.syncCachedViews()
    },

    closeCurrentTab(route: RouteItem) {
      const index = this.tabsList.findIndex(
        item => item.name === route.name || item.fullPath === route.fullPath,
      )
      if (index === -1)
        return
      const closed = this.tabsList[index]
      this.tabsList.splice(index, 1)
      this.removeCachedView(closed?.name)
    },

    closeAllTabs() {
      this.tabsList = retainAffixRoute(this.tabsList)
      this.syncCachedViews()
    },
  },
})

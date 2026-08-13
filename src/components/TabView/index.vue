<template>
  <div class="tab-view">
    <n-tabs
      v-if="tabs.length"
      v-model:value="activeName"
      type="card"
      animated
      class="tab-view__tabs"
      @update:value="onTabChange"
    >
      <n-tab-pane
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :tab="tab.title"
        display-directive="show:lazy"
      >
        <div class="tab-view__pane">
          <component :is="tab.component" />
        </div>
      </n-tab-pane>
    </n-tabs>
    <n-empty v-else description="暂无页面级子菜单" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  findMenuByName,
  isButtonMenu,
  isPageLevelMenu,
  resolveViewComponent,
} from '@/router/utils/buildDynamicRoutes'
import type { MenuItem } from '@/router/utils/types'
import { TAB_VIEW_QUERY_KEY } from './constants'

defineOptions({ name: 'TabView' })

interface TabItem {
  name: string
  title: string
  component: Component
}

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()

const tabs = ref<TabItem[]>([])
const activeName = ref<string>('')

function isTabChild(menu: MenuItem): boolean {
  if (isButtonMenu(menu))
    return false
  // 页面级优先；兼容未标 type 但挂在 TabView 下的普通子菜单
  return isPageLevelMenu(menu) || !!menu.component
}

function loadTabs() {
  const routeName = String(route.name ?? '')
  const host = findMenuByName(permissionStore.userMenuList, routeName)
  const children = (host?.children ?? []).filter(isTabChild)

  const modules = permissionStore.viewModules
  const baseDir = permissionStore.viewsBaseDir

  tabs.value = children.reduce<TabItem[]>((acc, child) => {
    if (!child.name || !child.component)
      return acc
    const loader = resolveViewComponent(modules, baseDir, child.component)
    if (!loader)
      return acc
    acc.push({
      name: child.name,
      title: child.meta?.title ?? child.name,
      component: defineAsyncComponent(loader),
    })
    return acc
  }, [])

  const queryTab = typeof route.query[TAB_VIEW_QUERY_KEY] === 'string'
    ? route.query[TAB_VIEW_QUERY_KEY]
    : ''
  const next = tabs.value.some(t => t.name === queryTab)
    ? queryTab
    : (tabs.value[0]?.name ?? '')
  activeName.value = next

  if (next && queryTab !== next) {
    router.replace({
      path: route.path,
      query: { ...route.query, [TAB_VIEW_QUERY_KEY]: next },
    })
  }
}

function onTabChange(name: string) {
  activeName.value = name
  router.replace({
    path: route.path,
    query: { ...route.query, [TAB_VIEW_QUERY_KEY]: name },
  })
}

watch(
  () => [route.name, permissionStore.userMenuList] as const,
  () => loadTabs(),
  { immediate: true, deep: true },
)

watch(
  () => route.query[TAB_VIEW_QUERY_KEY],
  (tab) => {
    if (typeof tab === 'string' && tab && tab !== activeName.value
      && tabs.value.some(t => t.name === tab)) {
      activeName.value = tab
    }
  },
)
</script>

<style scoped>
.tab-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.tab-view__tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.tab-view__tabs :deep(.n-tabs-pane-wrapper) {
  flex: 1;
  min-height: 0;
}

.tab-view__tabs :deep(.n-tab-pane) {
  height: 100%;
}

.tab-view__pane {
  height: 100%;
  min-height: 0;
  overflow: auto;
}
</style>

<template>
  <!--
    侧栏/顶栏用 v-show 隐藏，不要用 v-if 整棵切换。
    否则进入 hideMenu 设计页会销毁 keep-alive，返回列表实例被重建且易丢状态。
  -->
  <n-layout
    class="bpm-layout"
    :class="{ 'bpm-layout--embed': hideChrome }"
    has-sider
    :style="layoutThemeStyle"
  >
    <n-layout-sider
      v-show="!hideChrome"
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      :native-scrollbar="false"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="bpm-layout__brand" :class="{ 'bpm-layout__brand--collapsed': collapsed }">
        <span class="bpm-layout__logo">BPM</span>
        <span v-if="!collapsed" class="bpm-layout__title">流程设计</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="20"
        :options="bpmMenuOptions"
        :value="selectedKey"
        @update:value="onMenuSelect"
      />
    </n-layout-sider>

    <n-layout>
      <n-layout-header v-show="!hideChrome" bordered class="bpm-layout__header">
        <span class="bpm-layout__page-title">{{ pageTitle }}</span>
      </n-layout-header>
      <n-layout-content
        class="bpm-layout__content"
        :class="{ 'bpm-layout__content--embed': hideChrome }"
        :content-style="hideChrome ? 'padding: 0; height: 100%;' : 'padding: 16px; height: 100%;'"
      >
        <div class="bpm-layout__page page-container">
          <router-view v-slot="{ Component }">
            <keep-alive include="Bpm-Form">
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </div>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useThemeVars } from 'naive-ui'
import { bpmMenuOptions, resolveBpmMenuKey } from './menu'

defineOptions({ name: 'BpmLayout' })

const route = useRoute()
const router = useRouter()
const loadingStore = useLoadingStore()
const themeVars = useThemeVars()

const layoutThemeStyle = computed(() => {
  const t = themeVars.value
  return {
    '--bpm-layout-primary': t.primaryColor,
    '--bpm-layout-card': t.cardColor,
    '--bpm-layout-body': t.bodyColor,
    '--bpm-layout-text': t.textColor1,
    '--bpm-layout-border': t.borderColor,
  }
})

const collapsed = ref(false)

/** 嵌入 iframe、?hideMenu / ?isIframe、或路由 meta.hideMenu */
const hideChrome = computed(() => {
  if (loadingStore.isIframe)
    return true

  const q = route.query
  if (q.hideMenu === '1' || q.hideMenu === 'true' || q.hideMenu === '')
    return true
  if (q.isIframe === '1' || q.isIframe === 'true' || q.isIframe === '')
    return true

  return route.matched.some(r => r.meta?.hideMenu === true)
})

const selectedKey = computed(() =>
  resolveBpmMenuKey(route.name, route.meta?.activeMenu),
)

const pageTitle = computed(() => {
  const hit = route.matched
    .slice()
    .reverse()
    .find(r => r.meta?.title)
  return (hit?.meta?.title as string) || '流程设计'
})

function onMenuSelect(key: string) {
  if (key === route.name)
    return
  router.push({ name: key })
}
</script>

<style scoped>
.bpm-layout {
  min-height: 100vh;
  height: 100vh;
}
.bpm-layout--embed :deep(.n-layout-sider) {
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  overflow: hidden !important;
  border: none !important;
}
.bpm-layout--embed :deep(.n-layout-sider-scroll-container),
.bpm-layout--embed :deep(.n-layout-toggle-button) {
  display: none !important;
}
.bpm-layout--embed :deep(.bpm-model-editor),
.bpm-layout--embed :deep(.bpm-page),
.bpm-layout--embed :deep(.form-builder) {
  height: 100%;
  min-height: 0;
}
.bpm-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--bpm-layout-border, var(--n-border-color));
}
.bpm-layout__brand--collapsed {
  justify-content: center;
  padding: 0;
}
.bpm-layout__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--bpm-layout-primary, #3473ff);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.bpm-layout__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--bpm-layout-text, #111827);
  white-space: nowrap;
}
.bpm-layout__header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  background: var(--bpm-layout-card, #fff);
}
.bpm-layout__page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--bpm-layout-text, #111827);
}
.bpm-layout__content {
  background: var(--bpm-layout-body, #f5f7fb);
  height: calc(100vh - 56px);
  overflow: hidden;
}
.bpm-layout__content--embed {
  height: 100vh;
}
.bpm-layout__page {
  height: 100%;
  min-height: 0;
}
.bpm-layout__page.page-container {
  background: transparent;
}
.bpm-layout__page.page-container > :deep(*) {
  /* 覆盖 common.scss 里对 page-container 子节点的强制 flex，设计页需要自己撑满 */
  flex: 1 1 0%;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

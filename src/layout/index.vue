<template>
  <n-layout class="layout" has-sider>
    <!-- 左侧边栏（vertical / horizontal-mix 模式） -->
    <!-- show-trigger="bar" -->
    <n-layout-sider
      v-if="showSider"
      :collapsed="collapsed"
      collapse-mode="width"
      :collapsed-width="settingStore.menuSetting.minMenuWidth"
      :width="leftMenuWidth"
      :native-scrollbar="false"
      :inverted="inverted"
      class="layout-sider"
      :class="{ 'layout-sider-fixed': settingStore.menuSetting.fixed }"
      @collapse="collapsed = true"
      @expand="collapsed = false"
      @mouseenter="onSiderEnter"
      @mouseleave="onSiderLeave"
    >
      <Logo :collapsed="collapsed" />
      <AsideMenu v-model:collapsed="collapsed" />
    </n-layout-sider>

    <!-- 移动端抽屉侧边栏 -->
    <n-drawer
      v-model:show="showSideDrawer"
      :width="settingStore.menuSetting.menuWidth"
      placement="left"
    >
      <n-layout-sider
        :collapsed="false"
        :width="settingStore.menuSetting.menuWidth"
        :native-scrollbar="false"
        :inverted="inverted"
        class="layout-sider"
      >
        <Logo :collapsed="false" />
        <AsideMenu />
      </n-layout-sider>
    </n-drawer>

    <!-- 右侧主区域 -->
    <n-layout class="layout-main" :inverted="inverted">
      <n-layout-header :inverted="getHeaderInverted" :position="fixedHeader">
        <PageHeader v-model:collapsed="collapsed" :inverted="inverted" />
      </n-layout-header>

      <n-layout-content
        class="layout-content"
        :class="{ 'layout-default-background': !designStore.darkTheme }"
      >
        <div
          class="layout-content-main"
          :class="{
            'fluid-header': fixedHeader === 'static',
          }"
        >
          <TabsView v-if="isMultiTabs" v-model:collapsed="collapsed" />
          <div class="layout-page-loading">
            <AppLoadingBar />
          </div>
          <div class="main-view">
            <div class="main-view-inner">
              <MainView />
            </div>
          </div>
        </div>
      </n-layout-content>

      <n-layout-footer v-if="showFooter" class="layout-footer" bordered>
        Copyright © {{ currentYear }} {{ websiteConfig.title }}
      </n-layout-footer>

      <n-back-top :right="100" />
    </n-layout>
  </n-layout>
</template>

<script lang="ts" setup>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { Logo } from './components/Logo';
  import { TabsView } from './components/TagsView';
  import { MainView } from './components/Main';
  import { AsideMenu } from './components/Menu';
  import { PageHeader } from './components/Header';
  import AppLoadingBar from '@/components/common/AppLoadingBar.vue';
  import { websiteConfig } from '@/config/website.config';

  const designStore = useDesignSettingStore();
  const settingStore = useProjectSettingStore();

  const route = useRoute();
  const currentYear = new Date().getFullYear();

  const collapsed = ref(settingStore.menuSetting.collapsed);
  let hoverExpanded = false;

  function onSiderEnter() {
    if (settingStore.menuSetting.trigger !== 'hover') return;
    if (!collapsed.value) return;
    hoverExpanded = true;
    collapsed.value = false;
  }

  function onSiderLeave() {
    if (settingStore.menuSetting.trigger !== 'hover') return;
    if (!hoverExpanded) return;
    hoverExpanded = false;
    collapsed.value = true;
  }

  // ---- 计算属性 ----
  const isMobile = computed<boolean>({
    get: () => settingStore.getIsMobile,
    set: (val) => settingStore.setIsMobile(val),
  });

  watch(
    () => settingStore.menuSetting.collapsed,
    (val) => {
      if (!isMobile.value) collapsed.value = val;
    },
  );

  const fixedHeader = computed(() =>
    settingStore.headerSetting.fixed ? 'absolute' : 'static',
  );

  const isMultiTabs = computed(() => settingStore.multiTabsSetting.show);
  const showFooter = computed(() => settingStore.showFooter);

  const inverted = computed(() =>
    ['dark', 'header-dark'].includes(settingStore.navTheme),
  );

  const getHeaderInverted = computed(() =>
    ['light', 'header-dark'].includes(settingStore.navTheme) ? inverted.value : !inverted.value,
  );

  const leftMenuWidth = computed(() => {
    const { minMenuWidth, menuWidth } = settingStore.menuSetting;
    return collapsed.value ? minMenuWidth : menuWidth;
  });

  // 是否显示 sider（仅 vertical / horizontal-mix 且非移动端）
  const showSider = computed(() => {
    if (isMobile.value) return false;
    const mode = settingStore.navMode;
    if (mode === 'horizontal') return false;
    if (mode === 'horizontal-mix' && settingStore.menuSetting.mixMenu) {
      const top = route.matched.find((r) => r.name && r.name !== 'Layout');
      const hasChildren = (top?.children?.length ?? 0) > 0;
      return hasChildren;
    }
    return true;
  });

  // 移动端抽屉
  const showSideDrawer = computed({
    get: () => isMobile.value && collapsed.value,
    set: (val) => (collapsed.value = val),
  });

  // ---- 响应式宽度 ----
  const checkMobileMode = () => {
    const shouldBeMobile = document.body.clientWidth <= settingStore.menuSetting.mobileWidth;
    if (isMobile.value !== shouldBeMobile) {
      isMobile.value = shouldBeMobile;
      collapsed.value = false;
    }
  };

  const watchWidth = () => {
    const width = document.body.clientWidth;
    collapsed.value = width <= settingStore.menuSetting.mobileWidth;
    isMobile.value = collapsed.value;
  };

  onMounted(() => {
    checkMobileMode();
    window.addEventListener('resize', watchWidth);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', watchWidth);
  });
</script>

<style lang="scss" scoped>
  .layout {
    display: flex;
    flex-direction: row;
    flex: auto;
    height: 100vh;
    overflow: hidden;

    &-default-background {
      background: #f5f7f9;
    }

    :global(html.dark) &-default-background {
      background: transparent;
    }

    .layout-sider {
      min-height: 100vh;
      box-shadow: 2px 0 8px 0 rgb(29 35 41 / 5%);
      position: relative;
      z-index: 13;
      transition: all 0.2s ease-in-out;

      &.layout-sider-fixed {
        position: sticky;
        top: 0;
        height: 100vh;
      }
    }

    .n-layout-header.n-layout-header--absolute-positioned {
      z-index: 11;
    }
  }

  /*
   * Naive UI 的 n-layout 会把子节点包进 .n-layout-scroll-container，
   * flex 必须作用在该容器上，content 才能真正撑满剩余高度。
   */
  .layout-main {
    flex: 1;
    min-width: 0;
    height: 100%;
    overflow: hidden;

    :deep(> .n-layout-scroll-container) {
      height: 100% !important;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    :deep(.n-layout-header),
    :deep(.n-layout-footer) {
      flex-shrink: 0;
    }
  }

  .layout-content {
    flex: 1 1 0% !important;
    min-height: 0 !important;
    height: auto !important;
    overflow: hidden;

    :deep(> .n-layout-scroll-container) {
      height: 100% !important;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  }

  .layout-content-main {
    flex: 1;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding-top: 64px; /* 为 fixed header 空出 */
    box-sizing: border-box;
  }

  /* 标签栏下方：顶部进度条锚点（不占高度，贴在内容区上沿） */
  .layout-page-loading {
    position: relative;
    z-index: 6;
    height: 0;
    flex-shrink: 0;
  }

  .fluid-header {
    padding-top: 0;
  }

  .main-view {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 10px;
    box-sizing: border-box;
  }

  .main-view-inner {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
  }

  .layout-footer {
    flex-shrink: 0;
    text-align: center;
    padding: 12px 0;
    font-size: 13px;
    opacity: 0.75;
  }
</style>

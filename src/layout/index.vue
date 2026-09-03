<template>
  <!-- 被嵌入时只渲染页面内容，避免双层壳（侧栏/顶栏/页签） -->
  <div v-if="isEmbedMode" class="layout-embed">
    <MainView />
  </div>

  <n-layout v-else class="layout" has-sider>
    <!-- 左侧边栏（vertical / horizontal-mix 模式） -->
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
      <AsideMenu v-model:collapsed="collapsed" @click-menu-item="closeMobileDrawer" />
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
        <AsideMenu @click-menu-item="closeMobileDrawer" />
      </n-layout-sider>
    </n-drawer>

    <!-- 右侧主区域：不要给整块 main 设 inverted，否则浅色主题 + 暗色侧栏时内容/页脚会被误染深色 -->
    <n-layout class="layout-main">
      <n-layout-header :inverted="getHeaderInverted" :position="fixedHeader">
        <PageHeader v-model:collapsed="collapsed" :inverted="inverted" />
      </n-layout-header>

      <n-layout-content
        class="layout-content"
        :style="contentBgStyle"
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
          <div class="main-view" :style="mainViewStyle">
            <div class="page-container" :style="pageContainerStyle">
              <MainView />
            </div>
          </div>
        </div>
      </n-layout-content>

      <n-layout-footer v-if="showFooter" class="layout-footer" bordered>
        {{ footerDisplay }}
      </n-layout-footer>

      <n-back-top :right="100" />
    </n-layout>
  </n-layout>
</template>

<script lang="ts" setup>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { useThemeVars } from 'naive-ui';
  import { Logo } from './components/Logo';
  import { TabsView } from './components/TagsView';
  import { MainView } from './components/Main';
  import { AsideMenu } from './components/Menu';
  import { PageHeader } from './components/Header';
  import AppLoadingBar from '@/components/common/AppLoadingBar.vue';
  import { websiteConfig } from '@/config/website.config';
  import { stopAppMessageChannel } from '@/utils/appWebSocket';
  import { useT } from '@/hooks/useT';

  const designStore = useDesignSettingStore();
  const settingStore = useProjectSettingStore();
  const loadingStore = useLoadingStore();
  const themeVars = useThemeVars();
  const { t } = useT();

  const route = useRoute();
  const currentYear = new Date().getFullYear();

  /** 被主应用 iframe 嵌入时裁剪壳层 */
  const isEmbedMode = computed(() => loadingStore.isIframe);

  /** 移动端抽屉开关（不持久化；桌面折叠写回 menuSetting.collapsed） */
  const mobileDrawerOpen = ref(false);
  /** hover 临时展开，不写 store，避免误持久化 */
  const hoverExpanded = ref(false);

  const isMobile = computed({
    get: () => settingStore.isMobile,
    set: (val: boolean) => settingStore.setIsMobile(val),
  });

  const collapsed = computed({
    get: () => {
      if (isMobile.value)
        return mobileDrawerOpen.value;
      if (hoverExpanded.value)
        return false;
      return settingStore.menuSetting.collapsed;
    },
    set: (val: boolean) => {
      if (isMobile.value) {
        mobileDrawerOpen.value = val;
        return;
      }
      if (hoverExpanded.value && val) {
        hoverExpanded.value = false;
        return;
      }
      hoverExpanded.value = false;
      if (settingStore.menuSetting.collapsed !== val)
        settingStore.menuSetting.collapsed = val;
    },
  });

  function onSiderEnter() {
    if (settingStore.menuSetting.trigger !== 'hover')
      return;
    if (!settingStore.menuSetting.collapsed)
      return;
    hoverExpanded.value = true;
  }

  function onSiderLeave() {
    if (settingStore.menuSetting.trigger !== 'hover')
      return;
    if (!hoverExpanded.value)
      return;
    hoverExpanded.value = false;
  }

  function closeMobileDrawer() {
    if (isMobile.value)
      mobileDrawerOpen.value = false;
  }

  // 离开 hover 模式时清掉临时展开标记，避免之后误折叠
  watch(
    () => settingStore.menuSetting.trigger,
    (trigger) => {
      if (trigger !== 'hover')
        hoverExpanded.value = false;
    },
  );

  // 路由变化时关闭移动端抽屉
  watch(
    () => route.fullPath,
    () => closeMobileDrawer(),
  );

  const fixedHeader = computed(() =>
    settingStore.headerSetting.fixed ? 'absolute' : 'static',
  );

  const isMultiTabs = computed(() => settingStore.multiTabsSetting.show);
  const showFooter = computed(() => settingStore.showFooter);

  const footerDisplay = computed(() => {
    const custom = settingStore.footerText?.trim();
    if (custom) return custom;
    return t(
      'layout.footerCopyright',
      `Copyright © ${currentYear} ${websiteConfig.title}`,
      { year: currentYear, title: websiteConfig.title },
    );
  });

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

  const contentBgStyle = computed(() => {
    if (designStore.darkTheme) {
      return { background: 'transparent' };
    }
    return { background: themeVars.value.bodyColor || '#f5f7f9' };
  });

  const mainViewStyle = computed(() => {
    const padding = settingStore.contentSetting.padding ?? 10;
    return { padding: `${padding}px` };
  });

  const pageContainerStyle = computed(() => {
    const maxWidth = settingStore.contentSetting.maxWidth ?? 0;
    if (!maxWidth) return undefined;
    return {
      maxWidth: `${maxWidth}px`,
      width: '100%',
      margin: '0 auto',
    };
  });

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

  // 移动端：抽屉由 collapsed=true 表示「打开」
  const showSideDrawer = computed({
    get: () => isMobile.value && collapsed.value,
    set: (val) => (collapsed.value = val),
  });

  function syncViewportMode() {
    const mobile = document.body.clientWidth <= settingStore.menuSetting.mobileWidth;
    if (isMobile.value === mobile)
      return;

    isMobile.value = mobile;
    hoverExpanded.value = false;
    // 移动端：collapsed=true 表示抽屉打开；进入时默认关闭
    if (mobile)
      mobileDrawerOpen.value = false;
  }

  onMounted(() => {
    const mobile = document.body.clientWidth <= settingStore.menuSetting.mobileWidth;
    settingStore.setIsMobile(mobile);
    hoverExpanded.value = false;
    if (mobile)
      mobileDrawerOpen.value = false;
    window.addEventListener('resize', syncViewportMode);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', syncViewportMode);
    stopAppMessageChannel();
  });

  watch(
    () => settingStore.menuSetting.mobileWidth,
    () => syncViewportMode(),
  );
</script>

<style lang="scss" scoped>
  .layout-embed {
    width: var(--app-vw, 100vw);
    height: var(--app-vh, 100vh);
    height: var(--app-dvh, 100dvh);
    overflow: auto;
  }

  .layout {
    display: flex;
    flex-direction: row;
    flex: auto;
    /* body.zoom 补偿后用 --app-vw/--app-vh，避免缩放后宽高不足 */
    width: var(--app-vw, 100vw);
    height: var(--app-vh, 100vh);
    height: var(--app-dvh, 100dvh);
    overflow: hidden;

    .layout-sider {
      min-height: var(--app-vh, 100vh);
      min-height: var(--app-dvh, 100dvh);
      box-shadow: 2px 0 8px 0 rgb(29 35 41 / 5%);
      position: relative;
      z-index: 13;
      transition: all 0.2s ease-in-out;

      &.layout-sider-fixed {
        position: sticky;
        top: 0;
        height: var(--app-vh, 100vh);
        height: var(--app-dvh, 100dvh);
      }
    }

    .n-layout-header.n-layout-header--absolute-positioned {
      z-index: 11;
    }
  }

  :global(html.reduce-motion) .layout-sider {
    transition: none !important;
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
    box-sizing: border-box;
  }

  .page-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .layout-footer {
    flex-shrink: 0;
    text-align: center;
    padding: 12px 0;
    font-size: 13px;
    opacity: 0.75;
  }
</style>

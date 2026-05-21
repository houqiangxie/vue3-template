<template>
  <n-layout class="layout" has-sider>
    <!-- 左侧边栏（vertical / horizontal-mix 模式） -->
    <n-layout-sider
      v-if="showSider"
      show-trigger="bar"
      :collapsed="collapsed"
      collapse-mode="width"
      :collapsed-width="64"
      :width="leftMenuWidth"
      :native-scrollbar="false"
      :inverted="inverted"
      class="layout-sider"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <Logo :collapsed="collapsed" />
      <AsideMenu v-model:collapsed="collapsed" />
    </n-layout-sider>

    <!-- 移动端抽屉侧边栏 -->
    <n-drawer
      v-model:show="showSideDrawer"
      :width="menuSetting.menuWidth"
      placement="left"
    >
      <n-layout-sider
        :collapsed="false"
        :width="menuSetting.menuWidth"
        :native-scrollbar="false"
        :inverted="inverted"
        class="layout-sider"
      >
        <Logo :collapsed="false" />
        <AsideMenu />
      </n-layout-sider>
    </n-drawer>

    <!-- 右侧主区域 -->
    <n-layout :inverted="inverted">
      <n-layout-header :inverted="getHeaderInverted" :position="fixedHeader">
        <PageHeader v-model:collapsed="collapsed" :inverted="inverted" />
      </n-layout-header>

      <n-layout-content
        class="layout-content"
        :class="{ 'layout-default-background': !getDarkTheme }"
      >
        <div
          class="layout-content-main"
          :class="{
            'layout-content-main-fix': fixedMulti,
            'fluid-header': fixedHeader === 'static',
          }"
        >
          <TabsView v-if="isMultiTabs" v-model:collapsed="collapsed" />
          <div
            class="main-view"
            :class="{
              'main-view-fix': fixedMulti,
              'no-multi-tabs': !isMultiTabs,
              'mt-3': !isMultiTabs,
            }"
          >
            <MainView />
          </div>
        </div>
      </n-layout-content>

      <n-back-top :right="100" />
    </n-layout>
  </n-layout>
</template>

<script lang="ts" setup>
  import { ref, unref, computed, onMounted, onUnmounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { Logo } from './components/Logo';
  import { TabsView } from './components/TagsView';
  import { MainView } from './components/Main';
  import { AsideMenu } from './components/Menu';
  import { PageHeader } from './components/Header';
  import { useProjectSetting } from '@/hooks/setting/useProjectSetting';
  import { useDesignSetting } from '@/hooks/setting/useDesignSetting';
  import { useProjectSettingStore } from '@/store/modules/projectSetting';

  const { getDarkTheme } = useDesignSetting();
  const { navMode, navTheme, headerSetting, menuSetting, multiTabsSetting } = useProjectSetting();
  const settingStore = useProjectSettingStore();

  const route = useRoute();

  const collapsed = ref(false);

  // ---- 计算属性 ----
  const isMobile = computed<boolean>({
    get: () => settingStore.getIsMobile,
    set: (val) => settingStore.setIsMobile(val),
  });

  const fixedHeader = computed(() =>
    unref(headerSetting).fixed ? 'absolute' : 'static',
  );

  const isMultiTabs = computed(() => unref(multiTabsSetting).show);
  const fixedMulti = computed(() => unref(multiTabsSetting).fixed);

  const inverted = computed(() =>
    ['dark', 'header-dark'].includes(unref(navTheme)),
  );

  const getHeaderInverted = computed(() =>
    ['light', 'header-dark'].includes(unref(navTheme)) ? unref(inverted) : !unref(inverted),
  );

  const leftMenuWidth = computed(() => {
    const { minMenuWidth, menuWidth } = unref(menuSetting);
    return collapsed.value ? minMenuWidth : menuWidth;
  });

  // 是否显示 sider（仅 vertical / horizontal-mix 且非移动端）
  const showSider = computed(() => {
    if (isMobile.value) return false;
    const mode = unref(navMode);
    if (mode === 'horizontal') return false;
    if (mode === 'horizontal-mix') {
      return !(unref(menuSetting).mixMenu && (route.meta as any)?.isRoot);
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
    const shouldBeMobile = document.body.clientWidth <= unref(menuSetting).mobileWidth;
    if (isMobile.value !== shouldBeMobile) {
      isMobile.value = shouldBeMobile;
      collapsed.value = false;
    }
  };

  const watchWidth = () => {
    const width = document.body.clientWidth;
    collapsed.value = width <= unref(menuSetting).mobileWidth;
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

    .layout-sider {
      min-height: 100vh;
      box-shadow: 2px 0 8px 0 rgb(29 35 41 / 5%);
      position: relative;
      z-index: 13;
      transition: all 0.2s ease-in-out;
    }

    .layout-content {
      flex: auto;
      overflow: auto; /* Naive UI scroll container */
    }

    .n-layout-header.n-layout-header--absolute-positioned {
      z-index: 11;
    }
  }

  .layout-content-main {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding-top: 64px; /* 为 fixed header 空出 */
    box-sizing: border-box;
  }

  .layout-content-main-fix {
    padding-top: 64px;
  }

  .fluid-header {
    padding-top: 0;
  }

  .main-view {
    flex: 1;
    min-height: 0; /* 关键：允许 flex 子项在溢出时收缩 */
    overflow-y: auto;
    overflow-x: hidden;
    padding: 10px;
    box-sizing: border-box;
  }

  .main-view-fix {
    padding-top: 54px; /* 44px tabs + 10px 内边距 */
  }

  .no-multi-tabs {
    padding-top: 10px;
  }
</style>

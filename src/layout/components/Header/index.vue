<template>
  <div class="layout-header">
    <!-- 左侧：折叠 + 刷新 + 面包屑 -->
    <div class="layout-header-left">
      <div class="ml-1 layout-header-trigger layout-header-trigger-min" @click="handleMenuCollapsed">
        <n-icon size="18">
          <MenuUnfoldOutlined v-if="collapsed" />
          <MenuFoldOutlined v-else />
        </n-icon>
      </div>
      <div
        v-if="headerSetting.isReload"
        class="mr-1 layout-header-trigger layout-header-trigger-min"
        @click="reloadPage"
      >
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-icon size="18"><ReloadOutlined /></n-icon>
          </template>
          <span>刷新页面</span>
        </n-tooltip>
      </div>
      <n-breadcrumb v-if="crumbsSetting.show">
        <template v-for="routeItem in breadcrumbList" :key="routeItem.name">
          <n-breadcrumb-item v-if="routeItem.meta?.title">
            <n-dropdown
              v-if="routeItem.children && routeItem.children.length"
              :options="routeItem.children"
              @select="dropdownSelect"
            >
              <span class="link-text">
                <component
                  v-if="crumbsSetting.showIcon && routeItem.meta?.icon"
                  :is="routeItem.meta.icon"
                />
                {{ routeItem.meta.title }}
              </span>
            </n-dropdown>
            <span v-else class="link-text">
              <component
                v-if="crumbsSetting.showIcon && routeItem.meta?.icon"
                :is="routeItem.meta.icon"
              />
              {{ routeItem.meta.title }}
            </span>
          </n-breadcrumb-item>
        </template>
      </n-breadcrumb>
    </div>

    <!-- 右侧：全屏 + 用户 + 配置 -->
    <div class="layout-header-right">
      <!-- 全屏 -->
      <div class="layout-header-trigger layout-header-trigger-min">
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-icon size="18">
              <FullscreenExitOutlined v-if="isFullscreen" @click="toggleFullScreen" />
              <FullscreenOutlined v-else @click="toggleFullScreen" />
            </n-icon>
          </template>
          <span>{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
        </n-tooltip>
      </div>

      <!-- 用户头像/下拉 -->
      <div class="layout-header-trigger layout-header-trigger-min">
        <n-dropdown trigger="hover" :options="avatarOptions" @select="avatarSelect">
          <div class="avatar">
            <n-avatar round size="small">{{ usernameShort }}</n-avatar>
            <n-divider vertical />
            <span>{{ username }}</span>
          </div>
        </n-dropdown>
      </div>

      <!-- 项目配置 -->
      <div class="layout-header-trigger layout-header-trigger-min" @click="showSetting = true">
        <n-tooltip placement="bottom-end">
          <template #trigger>
            <n-icon size="18" style="font-weight: bold"><SettingOutlined /></n-icon>
          </template>
          <span>项目配置</span>
        </n-tooltip>
      </div>
    </div>
  </div>

  <ProjectSetting v-model:show="showSetting" />
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useProjectSetting } from '@/hooks/setting/useProjectSetting';
  import { local } from 'ux-web-storage';
  import { storage } from '@/utils/Storage';
  import { TABS_ROUTES } from '@/store/mutation-types';
  import { useTabsViewStore } from '@/store/modules/tabsView';
  import ProjectSetting from './ProjectSetting.vue';
  import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    ReloadOutlined,
    SettingOutlined,
  } from '@vicons/antd';

  const props = defineProps<{ collapsed?: boolean; inverted?: boolean }>();
  const emit = defineEmits(['update:collapsed']);

  const { headerSetting, crumbsSetting } = useProjectSetting();
  const route = useRoute();
  const router = useRouter();
  const showSetting = ref(false);
  const isFullscreen = ref(false);

  // ---- 用户信息 ----
  const username = computed(() => (local as any).token?.userName ?? '用户');
  const usernameShort = computed(() => {
    const name = username.value as string;
    return name ? name.charAt(0).toUpperCase() : 'U';
  });

  // ---- 面包屑 ----
  const breadcrumbList = computed(() =>
    route.matched
      .filter((item) => item.meta?.title)
      .map((item) => ({
        ...item,
        label: item.meta?.title,
        key: item.name as string,
        disabled: false,
        children: [] as any[],
      })),
  );

  const dropdownSelect = (key: string | number) => {
    router.push({ name: String(key) });
  };

  // ---- 刷新 ----
  const reloadPage = () => {
    router.push({ path: '/redirect' + route.fullPath });
  };

  // ---- 全屏 ----
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      isFullscreen.value = true;
    } else {
      document.exitFullscreen?.();
      isFullscreen.value = false;
    }
  };
  function onFullscreenChange() {
    isFullscreen.value = !!document.fullscreenElement;
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', onFullscreenChange);
  });

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', onFullscreenChange);
  });

  // ---- 用户下拉 ----
  const avatarOptions = [
    { label: '退出登录', key: 'logout' },
  ];

  const avatarSelect = (key: string) => {
    if (key === 'logout') {
      // 清理标签页持久化数据
      storage.remove(TABS_ROUTES);
      // 清理 tabsView store
      const tabsStore = useTabsViewStore();
      tabsStore.closeAllTabs();
      // 清理 token
      try {
        (local as any).removeItem?.('token');
        (local as any).clearItem?.('token');
        delete (local as any).token;
      } catch {}
      router.push({ name: 'Login' });
    }
  };

  function handleMenuCollapsed() {
    emit('update:collapsed', !props.collapsed);
  }
</script>

<style lang="scss" scoped>
  .layout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0;
    height: 64px;
    box-shadow: 0 1px 4px rgb(0 21 41 / 8%);
    transition: all 0.2s ease-in-out;
    width: 100%;
    z-index: 11;

    &-left {
      display: flex;
      align-items: center;

      .n-breadcrumb {
        display: inline-block;
      }
    }

    &-right {
      display: flex;
      align-items: center;
      margin-right: 20px;

      .avatar {
        display: flex;
        align-items: center;
        height: 64px;
        gap: 6px;
        cursor: pointer;
      }
    }

    &-trigger {
      display: inline-block;
      width: 64px;
      height: 64px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease-in-out;

      .n-icon {
        display: flex;
        align-items: center;
        height: 64px;
        line-height: 64px;
      }

      &:hover {
        background: hsla(0, 0%, 100%, 0.08);
      }
    }

    &-trigger-min {
      width: auto;
      padding: 0 12px;
    }
  }
</style>

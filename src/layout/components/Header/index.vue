<template>
  <div
    class="layout-header"
    :class="{
      'layout-header-light': !getInverted,
      'layout-header-custom-dark': headerOnDark,
    }"
    :style="headerStyle"
  >
    <!-- 顶部菜单模式 / 混合分割菜单：Logo + 横向菜单 -->
    <div
      v-if="isHorizontalHeader"
      class="layout-header-left layout-header-left-menu"
    >
      <div v-if="settingStore.navMode === 'horizontal' && showLogo" class="logo">
        <img :src="websiteConfig.logo" alt="logo" />
        <h2 class="title">{{ websiteConfig.title }}</h2>
      </div>
      <AsideMenu
        mode="horizontal"
        :collapsed="collapsed"
        :inverted="getInverted"
        location="header"
      />
    </div>

    <!-- 左侧菜单模式：折叠 + 刷新 + 面包屑 -->
    <div v-else class="layout-header-left">
      <div
        class="ml-1 layout-header-trigger layout-header-trigger-min"
        @click="handleMenuCollapsed"
      >
        <n-icon size="18">
          <MenuUnfoldOutlined v-if="collapsed" />
          <MenuFoldOutlined v-else />
        </n-icon>
      </div>
      <div
        v-if="showReload"
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
      <n-breadcrumb v-if="showCrumbs">
        <template v-for="routeItem in breadcrumbList" :key="routeItem.name">
          <n-breadcrumb-item v-if="routeItem.meta?.title">
            <n-dropdown
              v-if="routeItem.children && routeItem.children.length"
              :options="routeItem.children"
              @select="dropdownSelect"
            >
              <span class="link-text">
                <component
                  v-if="showCrumbsIcon && routeItem.meta?.icon"
                  :is="routeItem.meta.icon"
                  class="breadcrumb-icon"
                />
                {{ routeItem.meta.title }}
              </span>
            </n-dropdown>
            <span v-else class="link-text">
              <component
                v-if="showCrumbsIcon && routeItem.meta?.icon"
                :is="routeItem.meta.icon"
                class="breadcrumb-icon"
              />
              {{ routeItem.meta.title }}
            </span>
          </n-breadcrumb-item>
        </template>
      </n-breadcrumb>
    </div>

    <!-- 右侧：搜索 + 通知 + 刷新（顶栏模式）+ 全屏 + 用户 + 配置 -->
    <div class="layout-header-right">
      <HeaderSearch v-if="showSearch" />
      <HeaderNotice v-if="showNotice" />
      <div
        v-if="isHorizontalHeader && showReload"
        class="layout-header-trigger layout-header-trigger-min"
        @click="reloadPage"
      >
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-icon size="18"><ReloadOutlined /></n-icon>
          </template>
          <span>刷新页面</span>
        </n-tooltip>
      </div>
      <div
        v-if="showFullscreen"
        class="layout-header-trigger layout-header-trigger-min"
      >
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

      <div
        v-if="showUserInfo"
        class="layout-header-trigger layout-header-trigger-min"
      >
        <n-dropdown trigger="hover" :options="avatarOptions" @select="avatarSelect">
          <div class="avatar">
            <n-avatar round size="small">{{ usernameShort }}</n-avatar>
            <n-divider vertical />
            <span>{{ username }}</span>
          </div>
        </n-dropdown>
      </div>

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
  import { usePageReload } from '@/hooks/usePageReload';
  import { websiteConfig } from '@/config/website.config';
  import { storage } from '@/utils/Storage';
  import { AsideMenu } from '@/layout/components/Menu';
  import ProjectSetting from './ProjectSetting.vue';
  import HeaderSearch from './HeaderSearch.vue';
  import HeaderNotice from './HeaderNotice.vue';
  import type { MenuItem } from '@/router/utils/types';
  import { stopAppMessageChannel } from '@/utils/appWebSocket';
  import * as AntdIcons from '@vicons/antd';
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

  const settingStore = useProjectSettingStore();
  const designStore = useDesignSettingStore();
  const permissionStore = usePermissionStore();
  const route = useRoute();
  const router = useRouter();
  const showSetting = ref(false);
  const isFullscreen = ref(false);

  // 直接读 store，保证界面显示开关即时生效
  const showReload = computed(() => settingStore.headerSetting.isReload);
  const showCrumbs = computed(() => settingStore.crumbsSetting.show);
  const showCrumbsIcon = computed(() => settingStore.crumbsSetting.showIcon);
  const showLogo = computed(() => settingStore.showLogo);
  const showFullscreen = computed(() => settingStore.headerSetting.showFullscreen);
  const showUserInfo = computed(() => settingStore.headerSetting.showUserInfo);
  const showSearch = computed(() => settingStore.headerSetting.showSearch !== false);
  const showNotice = computed(() => settingStore.headerSetting.showNotice !== false);

  function hexLuminance(hex: string): number {
    const raw = hex.replace('#', '');
    if (raw.length !== 6) return 1;
    const r = parseInt(raw.slice(0, 2), 16) / 255;
    const g = parseInt(raw.slice(2, 4), 16) / 255;
    const b = parseInt(raw.slice(4, 6), 16) / 255;
    const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  const customHeaderBg = computed(() => {
    if (designStore.darkTheme) return '';
    const bg = settingStore.headerSetting.bgColor;
    if (!bg) return '';
    const normalized = bg.trim().toLowerCase();
    if (normalized === '#fff' || normalized === '#ffffff') return '';
    return bg;
  });

  const headerOnDark = computed(() => {
    const bg = customHeaderBg.value;
    return !!bg && hexLuminance(bg) < 0.45;
  });

  const headerStyle = computed(() => {
    const bg = customHeaderBg.value;
    if (!bg) return undefined;
    return {
      backgroundColor: bg,
      color: headerOnDark.value ? '#fff' : undefined,
    };
  });

  const mixMenu = computed(() => settingStore.menuSetting.mixMenu);

  const isHorizontalHeader = computed(
    () =>
      settingStore.navMode === 'horizontal' ||
      (settingStore.navMode === 'horizontal-mix' && mixMenu.value),
  );

  // 与布局 header inverted 规则一致
  const getInverted = computed(() =>
    ['light', 'header-dark'].includes(settingStore.navTheme)
      ? !!props.inverted
      : !props.inverted,
  );

  // ---- 用户信息 ----
  const username = computed(() => (local as any).token?.userName ?? '用户');
  const usernameShort = computed(() => {
    const name = username.value as string;
    return name ? name.charAt(0).toUpperCase() : 'U';
  });

  // ---- 面包屑（按菜单树回溯，补全 ParentView 扁平后丢失的目录）----
  function findMenuTrail(
    menus: MenuItem[],
    targetName: string,
    trail: MenuItem[] = [],
  ): MenuItem[] | null {
    for (const menu of menus) {
      const next = [...trail, menu];
      if (menu.name === targetName)
        return next;
      if (menu.children?.length) {
        const found = findMenuTrail(menu.children, targetName, next);
        if (found)
          return found;
      }
    }
    return null;
  }

  function menuSiblingsAsOptions(menu: MenuItem, parent?: MenuItem) {
    const siblings = (parent?.children ?? []).filter(
      m => m.name !== menu.name && !m.hidden && m.meta?.title,
    );
    return siblings.map(m => ({
      label: m.meta?.title,
      key: m.name,
    }));
  }

  function resolveCrumbIcon(icon?: unknown) {
    if (!icon || typeof icon !== 'string')
      return icon;
    return (AntdIcons as Record<string, unknown>)[icon] ?? icon;
  }

  const breadcrumbList = computed(() => {
    const menus = permissionStore.userMenuList as MenuItem[];
    const routeName = route.name ? String(route.name) : '';
    const activeMenu = route.meta?.activeMenu ? String(route.meta.activeMenu) : '';
    const target = activeMenu || routeName;

    const trail = target ? findMenuTrail(menus, target) : null;
    if (trail?.length) {
      // 隐藏页高亮 activeMenu 时，把当前页追加到末尾
      const items = [...trail];
      if (
        activeMenu
        && routeName
        && activeMenu !== routeName
        && route.meta?.title
        && !items.some(m => m.name === routeName)
      ) {
        items.push({
          id: -1,
          parentId: 0,
          name: routeName,
          path: route.path,
          meta: {
            title: String(route.meta.title),
            icon: route.meta.icon as string | undefined,
            breadcrumb: route.meta.breadcrumb as boolean | undefined,
          },
        });
      }

      return items
        .filter(m => m.meta?.title && m.meta?.breadcrumb !== false)
        .map((menu) => {
          const trailIdx = trail.findIndex(m => m.name === menu.name);
          const rawParent = trailIdx > 0
            ? trail[trailIdx - 1]
            : (trailIdx < 0 ? trail[trail.length - 1] : undefined);
          return {
            name: menu.name,
            meta: {
              ...menu.meta,
              icon: resolveCrumbIcon(menu.meta?.icon),
            },
            label: menu.meta?.title,
            key: menu.name,
            disabled: false,
            children: menuSiblingsAsOptions(menu, rawParent),
          };
        });
    }

    // 回退：仍用 matched（静态页 / 菜单尚未加载）
    return route.matched
      .filter(item => item.meta?.title && item.meta?.breadcrumb !== false)
      .map(item => ({
        name: item.name,
        meta: {
          ...item.meta,
          icon: resolveCrumbIcon(item.meta?.icon),
        },
        label: item.meta?.title,
        key: item.name as string,
        disabled: false,
        children: [] as { label?: unknown; key: string }[],
      }));
  });

  const dropdownSelect = (key: string | number) => {
    router.push({ name: String(key) });
  };

  const { reloadPage } = usePageReload();

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

  const avatarOptions = [{ label: '退出登录', key: 'logout' }];

  const avatarSelect = (key: string) => {
    if (key === 'logout') {
      stopAppMessageChannel();
      storage.remove(TABS_ROUTES);
      permissionStore.clearRoutes(router);
      permissionStore.setPermissions([]);
      permissionStore.setRoles([]);
      permissionStore.setMenus([]);
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
      align-self: stretch;
      flex: 1;
      min-width: 0;
      overflow: hidden;

      .logo {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 0 16px 0 12px;
        flex-shrink: 0;

        img {
          width: auto;
          height: 32px;
          margin-right: 10px;
        }

        .title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          white-space: nowrap;
          line-height: 1;
        }
      }

      .n-breadcrumb {
        display: inline-block;
      }

      :deep(.n-menu) {
        flex: 1;
        min-width: 0;
      }
    }

    &-left-menu {
      align-self: stretch;

      :deep(.n-menu.n-menu--horizontal) {
        height: 100%;
        display: flex;
        align-items: stretch;

        .n-menu-item,
        .n-submenu {
          height: 64px !important;
          margin-top: 0 !important;
        }

        .n-menu-item-content {
          height: 64px !important;
        }
      }
    }

    &-right {
      display: flex;
      align-items: stretch;
      align-self: stretch;
      margin-right: 20px;
      flex-shrink: 0;

      .avatar {
        display: flex;
        align-items: center;
        height: 100%;
        gap: 6px;
        cursor: pointer;
      }
    }

    &-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 100%;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease-in-out;

      .n-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &:hover {
        background: hsla(0, 0%, 100%, 0.08);
      }
    }

    &-trigger-min {
      width: auto;
      padding: 0 12px;
    }

    &-light {
      .layout-header-trigger:hover {
        background: #f8f8f9;
      }
    }

    &-custom-dark {
      color: #fff;

      :deep(.n-breadcrumb),
      :deep(.n-breadcrumb-item),
      :deep(.n-icon),
      .link-text,
      .avatar span {
        color: #fff !important;
      }

      .layout-header-trigger:hover {
        background: rgba(255, 255, 255, 0.12);
      }
    }
  }
</style>

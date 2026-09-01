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
          <span>{{ t('layout.refreshPage', '刷新页面') }}</span>
        </n-tooltip>
      </div>
      <n-breadcrumb v-if="showCrumbs">
        <template v-for="(routeItem, index) in breadcrumbList" :key="routeItem.name">
          <n-breadcrumb-item v-if="routeItem.meta?.title">
            <n-dropdown
              :options="routeItem.children"
              :disabled="!routeItem.children.length"
              @select="dropdownSelect"
            >
              <span
                class="link-text"
                :class="{ 'link-text--nav': routeItem.navigable }"
                @click.stop="onCrumbClick(routeItem, index)"
              >
                <n-icon
                  v-if="showCrumbsIcon && routeItem.meta?.icon"
                  :size="14"
                  class="breadcrumb-icon"
                >
                  <component :is="routeItem.meta.icon" />
                </n-icon>
                {{ routeItem.meta.title }}
              </span>
            </n-dropdown>
          </n-breadcrumb-item>
        </template>
      </n-breadcrumb>
    </div>

    <!-- 右侧：搜索 + 通知 + 刷新（顶栏模式）+ 全屏 + 用户 + 配置 -->
    <div class="layout-header-right">
      <HeaderSearch v-if="showSearch" />
      <HeaderNotice v-if="showNotice" />
      <div
        v-if="showLocale"
        class="layout-header-trigger layout-header-trigger-min"
      >
        <LocaleSwitcher mode="icon" />
      </div>
      <div
        v-if="isHorizontalHeader && showReload"
        class="layout-header-trigger layout-header-trigger-min"
        @click="reloadPage"
      >
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-icon size="18"><ReloadOutlined /></n-icon>
          </template>
          <span>{{ t('layout.refreshPage', '刷新页面') }}</span>
        </n-tooltip>
      </div>
      <div
        v-if="showFullscreen"
        class="layout-header-trigger layout-header-trigger-min"
        @click="toggleFullScreen"
      >
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-icon size="18">
              <FullscreenExitOutlined v-if="isFullscreen" />
              <FullscreenOutlined v-else />
            </n-icon>
          </template>
          <span>{{
            isFullscreen
              ? t('layout.exitFullscreen', '退出全屏')
              : t('layout.fullscreen', '全屏')
          }}</span>
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
          <span>{{ t('layout.projectConfig', '项目配置') }}</span>
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
  import { AsideMenu } from '@/layout/components/Menu';
  import ProjectSetting from './ProjectSetting.vue';
  import HeaderSearch from './HeaderSearch.vue';
  import HeaderNotice from './HeaderNotice.vue';
  import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue';
  import type { MenuItem } from '@/router/utils/types';
  import { resolveAntdIcon } from '@/config/menu/resolveMenuIcon';
  import { stopAppMessageChannel } from '@/utils/appWebSocket';
  import { hexLuminance, resolveCustomBg } from '@/utils/layout';
  import { useT } from '@/hooks/useT';
  import { I18N_ENABLED } from '@/i18n/config';
  import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    ReloadOutlined,
    SettingOutlined,
  } from '@vicons/antd';

  type TokenInfo = {
    token?: string
    userName?: string
    refreshToken?: string
    expiresAt?: number
  };

  const props = defineProps<{ collapsed?: boolean; inverted?: boolean }>();
  const emit = defineEmits(['update:collapsed']);

  const settingStore = useProjectSettingStore();
  const designStore = useDesignSettingStore();
  const permissionStore = usePermissionStore();
  const route = useRoute();
  const router = useRouter();
  const { t } = useT();
  const showSetting = ref(false);
  const isFullscreen = ref(false);

  // 直接读 store，保证界面显示开关即时生效
  const showReload = computed(() => settingStore.headerSetting.isReload);
  const showCrumbs = computed(() => settingStore.crumbsSetting.show);
  const showCrumbsIcon = computed(() => settingStore.crumbsSetting.showIcon);
  const showLogo = computed(() => settingStore.showLogo);
  const showFullscreen = computed(() => settingStore.headerSetting.showFullscreen);
  const showUserInfo = computed(() => settingStore.headerSetting.showUserInfo);
  const showSearch = computed(() => settingStore.headerSetting.showSearch);
  const showNotice = computed(() => settingStore.headerSetting.showNotice);
  const showLocale = computed(
    () => I18N_ENABLED && settingStore.headerSetting.showLocale,
  );

  const customHeaderBg = computed(() => {
    if (designStore.darkTheme)
      return '';
    return resolveCustomBg(
      settingStore.headerSetting.bgFollowTheme,
      settingStore.headerSetting.bgColor,
    );
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
  const username = computed(() => {
    const name = (local as { token?: TokenInfo }).token?.userName;
    return name || t('layout.defaultUser', '用户');
  });
  const usernameShort = computed(() => {
    const name = username.value;
    return name ? name.charAt(0).toUpperCase() : 'U';
  });

  // ---- 面包屑（按菜单树回溯，补全 ParentView 扁平后丢失的目录）----
  const DIRECTORY_COMPONENTS = new Set(['ParentView', 'Layout', 'ParentView/index']);

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

  function isDirectoryMenu(menu: MenuItem) {
    const comp = menu.component?.replace(/^\/+/, '') ?? '';
    if (menu.children?.length) {
      if (!comp || DIRECTORY_COMPONENTS.has(comp))
        return true;
      if (menu.type === 1 || menu.type === 'M')
        return true;
    }
    return false;
  }

  function menuToOptions(menus: MenuItem[]) {
    return menus
      .filter(m => !m.hidden && m.meta?.title)
      .map(m => ({
        label: m.meta?.title,
        key: m.name,
      }));
  }

  /** 目录：下拉子菜单；页面：下拉同级菜单，便于切换 */
  function crumbDropdownOptions(menu: MenuItem, parent?: MenuItem) {
    if (menu.children?.length)
      return menuToOptions(menu.children);
    const siblings = (parent?.children ?? []).filter(m => m.name !== menu.name);
    return menuToOptions(siblings);
  }

  function firstLeafMenu(menu: MenuItem): MenuItem | null {
    if (!isDirectoryMenu(menu))
      return menu.name ? menu : null;
    for (const child of menu.children ?? []) {
      if (child.hidden)
        continue;
      const leaf = firstLeafMenu(child);
      if (leaf)
        return leaf;
    }
    return null;
  }

  function resolveNavigateTarget(menu: MenuItem): string | null {
    if (/^https?:/.test(menu.path))
      return menu.path;

    if (menu.redirect && menu.redirect !== 'noRedirect')
      return menu.redirect;

    if (isDirectoryMenu(menu)) {
      const leaf = firstLeafMenu(menu);
      return leaf?.name ?? null;
    }

    return menu.name || null;
  }

  type CrumbItem = {
    name: string
    path?: string
    meta: Record<string, unknown>
    label?: string
    key: string
    navigable: boolean
    navigateTarget: string | null
    children: { label?: unknown; key: string }[]
  };

  const breadcrumbList = computed((): CrumbItem[] => {
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

      const visible = items.filter(m => m.meta?.title && m.meta?.breadcrumb !== false);
      return visible.map((menu, index) => {
        const trailIdx = trail.findIndex(m => m.name === menu.name);
        const rawParent = trailIdx > 0
          ? trail[trailIdx - 1]
          : (trailIdx < 0 ? trail[trail.length - 1] : undefined);
        const isLast = index === visible.length - 1;
        const navigateTarget = resolveNavigateTarget(menu);
        const sameAsCurrent = !!navigateTarget
          && (navigateTarget === routeName || navigateTarget === route.path);
        return {
          name: menu.name,
          path: menu.path,
          meta: {
            ...menu.meta,
            icon: resolveAntdIcon(menu.meta?.icon),
          },
          label: menu.meta?.title,
          key: menu.name,
          navigable: !isLast && !!navigateTarget && !sameAsCurrent,
          navigateTarget,
          children: crumbDropdownOptions(menu, rawParent),
        };
      });
    }

    // 回退：仍用 matched（静态页 / 菜单尚未加载）
    const matched = route.matched
      .filter(item => item.meta?.title && item.meta?.breadcrumb !== false);
    return matched.map((item, index) => {
      const name = String(item.name ?? '');
      const isLast = index === matched.length - 1;
      return {
        name,
        path: item.path,
        meta: {
          ...item.meta,
          icon: resolveAntdIcon(item.meta?.icon),
        },
        label: item.meta?.title as string | undefined,
        key: name,
        navigable: !isLast && !!name && name !== routeName,
        navigateTarget: name || null,
        children: [] as { label?: unknown; key: string }[],
      };
    });
  });

  function pushByTarget(target: string) {
    if (/^https?:/.test(target)) {
      window.open(target);
      return;
    }
    if (target.startsWith('/'))
      router.push(target);
    else
      router.push({ name: target });
  }

  const dropdownSelect = (key: string | number) => {
    pushByTarget(String(key));
  };

  function onCrumbClick(item: CrumbItem, index: number) {
    if (!item.navigable || !item.navigateTarget)
      return;
    // 有下拉时仅末级以外可点；避免与下拉抢交互时仍允许显式点击跳转
    if (index === breadcrumbList.value.length - 1)
      return;
    pushByTarget(item.navigateTarget);
  }

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

  const avatarOptions = computed(() => [
    { label: t('layout.logout', '退出登录'), key: 'logout' },
  ]);

  const avatarSelect = (key: string) => {
    if (key === 'logout') {
      stopAppMessageChannel();
      permissionStore.logout(router);
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

      :deep(.n-breadcrumb) {
        line-height: 1;
      }

      :deep(.n-breadcrumb > ul) {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
      }

      :deep(.n-breadcrumb-item) {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
      }

      :deep(.n-breadcrumb-item__link) {
        display: inline-flex;
        align-items: center;
        line-height: 1;
      }

      :deep(.n-breadcrumb-item__separator) {
        display: inline-flex;
        align-items: center;
        line-height: 1;
      }

      .link-text {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        line-height: 1;
        font-size: 14px;

        &--nav {
          cursor: pointer;

          &:hover {
            color: var(--n-primary-color);
          }
        }
      }

      .breadcrumb-icon {
        flex-shrink: 0;
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

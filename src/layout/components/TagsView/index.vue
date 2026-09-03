<template>
  <div
    class="tabs-view"
    :class="{
      'tabs-view-default-background': !getDarkTheme,
      'tabs-view-dark-background': getDarkTheme,
      ['tabs-style-' + tabsStyle]: true,
      'tabs-view--fixed': tabsFixed,
    }"
    :style="tabsViewStyle"
  >
    <div class="tabs-view-main">
      <!-- 标签卡片区 -->
      <div ref="navWrap" class="tabs-card" :class="{ 'tabs-card-scrollable': scrollable }">
        <span
          class="tabs-card-prev"
          :class="{ 'tabs-card-prev-hide': !scrollable }"
          @click="scrollPrev"
        >
          <n-icon size="16" color="#515a6e"><LeftOutlined /></n-icon>
        </span>
        <span
          class="tabs-card-next"
          :class="{ 'tabs-card-next-hide': !scrollable }"
          @click="scrollNext"
        >
          <n-icon size="16" color="#515a6e"><RightOutlined /></n-icon>
        </span>

        <div ref="navScroll" class="tabs-card-scroll">
          <Draggable :list="tabsList" animation="300" item-key="name" class="flex">
            <template #item="{ element }">
              <div
                :id="`tag${String(element.name).split('/').join('\\/')}`"
                class="tabs-card-scroll-item"
                :class="{ 'active-item': isTabActive(element) }"
                @click.stop="goPage(element)"
                @contextmenu="handleContextMenu($event, element)"
              >
                <span>{{ element.meta?.title }}</span>
                <n-icon
                  v-if="!element.meta?.affix"
                  size="14"
                  @click.stop="closeTabItem(element)"
                >
                  <CloseOutlined />
                </n-icon>
              </div>
            </template>
          </Draggable>
        </div>
      </div>

      <!-- 关闭下拉菜单 -->
      <div v-if="showTabsMenu" class="tabs-close">
        <n-dropdown
          trigger="hover"
          placement="bottom-end"
          :options="TabsMenuOptions"
          @select="closeHandleSelect"
        >
          <div class="tabs-close-btn">
            <n-icon size="16" color="#515a6e"><DownOutlined /></n-icon>
          </div>
        </n-dropdown>
      </div>

      <!-- 右键菜单 -->
      <n-dropdown
        v-if="showTabsMenu"
        :show="showDropdown"
        :x="dropdownX"
        :y="dropdownY"
        placement="bottom-start"
        :options="TabsMenuOptions"
        @clickoutside="onClickOutside"
        @select="closeHandleSelect"
      />
    </div>
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    reactive,
    computed,
    ref,
    toRefs,
    provide,
    watch,
    onMounted,
    onUnmounted,
    nextTick,
  } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { local } from 'ux-web-storage';
  import type { RouteItem } from '@/store/tabsView';
  import { usePageReload } from '@/hooks/usePageReload';
  import { useMessage, useThemeVars } from 'naive-ui';
  import Draggable from 'vuedraggable';
  import {
    DownOutlined,
    ReloadOutlined,
    CloseOutlined,
    ColumnWidthOutlined,
    MinusOutlined,
    LeftOutlined,
    RightOutlined,
  } from '@vicons/antd';
  import { renderIcon, resolveCustomBg } from '@/utils/layout';
  import { useT } from '@/hooks/useT';
  export default defineComponent({
    name: 'TabsView',
    components: { DownOutlined, CloseOutlined, LeftOutlined, RightOutlined, Draggable },
    props: {
      collapsed: { type: Boolean },
    },
    setup() {
      const designStore = useDesignSettingStore();
      const settingStore = useProjectSettingStore();
      const message = useMessage();
      const { t } = useT();
      const route = useRoute();
      const router = useRouter();
      const tabsViewStore = useTabsViewStore();
      const whiteList = ['Login', 'ErrorPage'];

      const navScroll = ref<HTMLElement | null>(null);
      const navWrap = ref<HTMLElement | null>(null);
      const isCurrent = ref(false);

      const themeVars = useThemeVars();
      const getCardColor = computed(() => themeVars.value.cardColor);
      const getBaseColor = computed(() => themeVars.value.textColor1);
      const getDarkTheme = computed(() => designStore.darkTheme);
      const getAppTheme = computed(() => designStore.appTheme);

      const state = reactive({
        activeKey: route.fullPath,
        scrollable: false,
        dropdownX: 0,
        dropdownY: 0,
        showDropdown: false,
      });

      // ---- 简化的路由信息提取 ----
      const getSimpleRoute = (r: any): RouteItem => {
        const { fullPath, hash, meta, name, params, path, query } = r;
        return { fullPath, hash, meta, name, params, path, query };
      };

      const tabsStyle = computed(() => settingStore.multiTabsSetting.style || 'card');
      const tabsFixed = computed(() => settingStore.multiTabsSetting.fixed !== false);
      const showTabsMenu = computed(() => settingStore.multiTabsSetting.showContextMenu !== false);

      const tabsViewStyle = computed(() => {
        if (getDarkTheme.value)
          return undefined;
        const bg = resolveCustomBg(
          settingStore.multiTabsSetting.bgFollowTheme,
          settingStore.multiTabsSetting.bgColor,
        );
        return bg ? { backgroundColor: bg } : undefined;
      });

      const TabsMenuOptions = computed(() => {
        const isDisabled = tabsList.value.length <= 1;
        return [
          { label: t('layout.tabsRefresh', '刷新当前'), key: '1', icon: renderIcon(ReloadOutlined) },
          { label: t('layout.tabsClose', '关闭当前'), key: '2', disabled: isCurrent.value || isDisabled, icon: renderIcon(CloseOutlined) },
          { label: t('layout.tabsCloseOther', '关闭其他'), key: '3', disabled: isDisabled, icon: renderIcon(ColumnWidthOutlined) },
          { label: t('layout.tabsCloseAll', '关闭全部'), key: '4', disabled: isDisabled, icon: renderIcon(MinusOutlined) },
        ];
      });

      // ---- 初始化标签页（从 local 恢复）----
      let cacheRoutes: RouteItem[] = [];
      const simpleRoute = getSimpleRoute(route);
      try {
        if (settingStore.multiTabsSetting.persist) {
          const cached = local[TABS_ROUTES] as RouteItem[] | undefined;
          cacheRoutes = Array.isArray(cached) ? cached : [simpleRoute];
        } else {
          cacheRoutes = [simpleRoute];
        }
      } catch {
        cacheRoutes = [simpleRoute];
      }

      // 过滤掉白名单中的路由，并确保每个路由都有 name
      cacheRoutes = cacheRoutes.filter(cr => cr.name && !whiteList.includes(cr.name));

      // 更新缓存路由的 meta/name（防止过期）
      const allRoutes = router.getRoutes();
      cacheRoutes.forEach((cr) => {
        const found = allRoutes.find((r) => r.path === cr.path);
        if (found) {
          cr.meta = { ...found.meta, ...cr.meta };
          cr.name = (found.name || cr.name) as string;
        }
      });

      tabsViewStore.initTabs(cacheRoutes);

      const tabsList = computed(() => tabsViewStore.tabsList);

      // 路由变化时添加标签
      watch(
        () => [route.fullPath, route.name],
        ([fullPath, name]) => {
          if (!name || whiteList.includes(name as string)) return;
          
          // 只有当当前路由是 matched 数组中的最后一个时才添加（即叶子节点）
          // 并且排除掉带有重定向的中间级路由
          const lastMatched = route.matched[route.matched.length - 1];
          const isLeaf = route.matched.length > 0 && lastMatched?.name === name;
          // RouteLocation 无 redirect；只看 matched 记录 / 自定义 meta
          const hasRedirect = Boolean(
            lastMatched?.redirect ?? (route.meta as { redirect?: unknown } | undefined)?.redirect,
          );

          if (!isLeaf || hasRedirect) return;

          state.activeKey = fullPath as string;
          tabsViewStore.addTab(getSimpleRoute(route));
          updateNavScroll(true);
        },
        { immediate: true },
      );

      // 页面刷新前保存标签
      const saveTabsBeforeUnload = () => {
        if (!settingStore.multiTabsSetting.persist) {
          delete local[TABS_ROUTES];
          return;
        }
        local[TABS_ROUTES] = tabsList.value;
      };

      // ---- 关闭操作 ----
      const { reloadPage } = usePageReload();
      provide('reloadPage', reloadPage);

      const removeTab = (r: any) => {
        if (tabsList.value.length === 1) {
          return message.warning('这已经是最后一页，不能再关闭了！');
        }
        // 关闭前先找到相邻 tab（前一个优先）；iframe 按 name 匹配更稳
        const closingIndex = tabsList.value.findIndex(
          item => item.name === r.name || item.fullPath === r.fullPath,
        );
        const adjacentTab =
          tabsList.value[closingIndex - 1] || tabsList.value[closingIndex + 1];

        tabsViewStore.closeCurrentTab(r);

        const closingIsActive = state.activeKey === r.fullPath
          || (!!r.name && r.name === route.name);
        if (closingIsActive && adjacentTab) {
          state.activeKey = adjacentTab.fullPath;
          router.push(adjacentTab);
        }
        updateNavScroll();
      };

      const closeOther = (r: any) => {
        tabsViewStore.closeOtherTabs(r);
        state.activeKey = r.fullPath;
        router.replace(r.fullPath);
        updateNavScroll();
      };

      const closeAll = () => {
        tabsViewStore.closeAllTabs();
        const first = tabsViewStore.tabsList[0];
        if (first)
          router.replace(first.fullPath);
        else
          router.replace('/');
        updateNavScroll();
      };

      const closeHandleSelect = (key: string) => {
        switch (key) {
          case '1': reloadPage(); break;
          case '2': removeTab(route); break;
          case '3': closeOther(route); break;
          case '4': closeAll(); break;
        }
        updateNavScroll();
        state.showDropdown = false;
      };

      // ---- 滚动控制 ----
      function scrollTo(value: number, amplitude: number) {
        const el = navScroll.value!;
        const currentScroll = el.scrollLeft;
        const scrollWidth =
          (amplitude > 0 && currentScroll + amplitude >= value) ||
          (amplitude < 0 && currentScroll + amplitude <= value)
            ? value
            : currentScroll + amplitude;
        el.scrollTo(scrollWidth, 0);
        if (scrollWidth === value) return;
        return window.requestAnimationFrame(() => scrollTo(value, amplitude));
      }

      function scrollPrev() {
        const el = navScroll.value!;
        const containerWidth = el.offsetWidth;
        const currentScroll = el.scrollLeft;
        if (!currentScroll) return;
        const scrollLeft = currentScroll > containerWidth ? currentScroll - containerWidth : 0;
        scrollTo(scrollLeft, (scrollLeft - currentScroll) / 20);
      }

      function scrollNext() {
        const el = navScroll.value!;
        const containerWidth = el.offsetWidth;
        const navWidth = el.scrollWidth;
        const currentScroll = el.scrollLeft;
        if (navWidth - currentScroll <= containerWidth) return;
        const scrollLeft =
          navWidth - currentScroll > containerWidth * 2
            ? currentScroll + containerWidth
            : navWidth - containerWidth;
        scrollTo(scrollLeft, (scrollLeft - currentScroll) / 20);
      }

      async function updateNavScroll(autoScroll?: boolean) {
        await nextTick();
        if (!navScroll.value) return;
        const containerWidth = navScroll.value.offsetWidth;
        const navWidth = navScroll.value.scrollWidth;
        if (containerWidth < navWidth) {
          state.scrollable = true;
          if (autoScroll) {
            const tagList = navScroll.value.querySelectorAll('.tabs-card-scroll-item') || [];
            const activeName = String(route.name || '');
            const activeId = activeName
              ? `tag${activeName.split('/').join('\\/')}`
              : `tag${state.activeKey.split('/').join('\\/')}`;
            ([...tagList] as HTMLElement[]).forEach((tag) => {
              if (tag.id === activeId)
                tag.scrollIntoView && tag.scrollIntoView();
            });
          }
        } else {
          state.scrollable = false;
        }
      }

      const currentContextItem = ref<any>(null);

      function handleContextMenu(e: MouseEvent, item: any) {
        if (!showTabsMenu.value) return;
        e.preventDefault();
        currentContextItem.value = item;
        isCurrent.value = item.path === '/' || !!(item.meta?.affix);
        state.showDropdown = false;
        nextTick().then(() => {
          state.showDropdown = true;
          state.dropdownX = e.clientX;
          state.dropdownY = e.clientY;
        });
      }

      function onClickOutside() {
        state.showDropdown = false;
      }

      /** iframe 页按 name 高亮，避免子路径同步时标签闪烁/重挂 */
      function isTabActive(element: RouteItem) {
        if (element.meta?.iFrameUrl || route.meta?.iFrameUrl)
          return !!element.name && element.name === route.name;
        return element.fullPath === route.fullPath || element.fullPath === state.activeKey;
      }

      function goPage(e: any) {
        const { fullPath, name } = e;
        if (e.meta?.iFrameUrl && name && name === route.name)
          return;
        if (fullPath === route.fullPath) return;
        state.activeKey = fullPath;
        router.push(e);
      }

      function closeTabItem(e: any) {
        const routeInfo = tabsList.value.find(
          item => item.name === e.name || item.fullPath === e.fullPath,
        );
        if (routeInfo) removeTab(routeInfo);
      }

      let resizeObserver: ResizeObserver | null = null;

      onMounted(() => {
        if (navWrap.value && typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => updateNavScroll(true));
          resizeObserver.observe(navWrap.value);
        }
        window.addEventListener('beforeunload', saveTabsBeforeUnload);
      });

      onUnmounted(() => {
        window.removeEventListener('beforeunload', saveTabsBeforeUnload);
        resizeObserver?.disconnect();
        resizeObserver = null;
      });

      return {
        ...toRefs(state),
        navWrap,
        navScroll,
        route,
        tabsList,
        goPage,
        closeTabItem,
        isTabActive,
        closeAll,
        reloadPage,
        tabsViewStyle,
        tabsStyle,
        tabsFixed,
        showTabsMenu,
        TabsMenuOptions,
        closeHandleSelect,
        scrollNext,
        scrollPrev,
        handleContextMenu,
        onClickOutside,
        getDarkTheme,
        getAppTheme,
        getCardColor,
        getBaseColor,
      };
    },
  });
</script>

<style lang="scss" scoped>
  .tabs-view {
    width: 100%;
    flex-shrink: 0;
    padding: 6px 10px;
    display: flex;
    transition: all 0.2s ease-in-out;
    box-sizing: border-box;

    &-main {
      height: 32px;
      display: flex;
      max-width: 100%;
      min-width: 100%;

      .tabs-card {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
        position: relative;

        .tabs-card-prev,
        .tabs-card-next {
          width: 32px;
          text-align: center;
          position: absolute;
          line-height: 32px;
          cursor: pointer;

          .n-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 32px;
            width: 32px;
          }
        }

        .tabs-card-prev { left: 0; }
        .tabs-card-next { right: 0; }

        .tabs-card-prev-hide,
        .tabs-card-next-hide {
          display: none;
        }

        &-scroll {
          white-space: nowrap;
          overflow: hidden;

          &-item {
            background: v-bind(getCardColor);
            color: v-bind(getBaseColor);
            height: 32px;
            padding: 6px 16px 4px;
            border-radius: 3px;
            margin-right: 6px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            position: relative;
            flex: 0 0 auto;
            gap: 4px;

            &:hover { color: #515a6e; }

            .n-icon {
              height: 22px;
              width: 21px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #808695;

              &:hover { color: #515a6e !important; }
            }
          }

          .active-item {
            color: v-bind(getAppTheme);
          }
        }
      }

      .tabs-card-scrollable {
        padding: 0 32px;
        overflow: hidden;
      }
    }

    .tabs-close {
      min-width: 32px;
      width: 32px;
      height: 32px;
      line-height: 32px;
      text-align: center;
      border-radius: 2px;
      cursor: pointer;

      &-btn {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .tabs-view-default-background { background: v-bind(getCardColor); }
  .tabs-view-dark-background    { background: v-bind(getCardColor); }

  .tabs-view--fixed {
    position: sticky;
    top: 0;
    z-index: 5;
  }

  .tabs-style-simple {
    .tabs-card-scroll-item {
      background: transparent !important;
      border-radius: 0 !important;
      border-bottom: 2px solid transparent;
      margin-right: 2px;

      &.active-item {
        border-bottom-color: v-bind(getAppTheme);
      }
    }
  }

  .tabs-style-dot {
    .tabs-card-scroll-item {
      background: transparent !important;
      padding-left: 22px !important;

      &::before {
        content: '';
        position: absolute;
        left: 8px;
        top: 50%;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        transform: translateY(-50%);
        background: #c0c4cc;
      }

      &.active-item::before {
        background: v-bind(getAppTheme);
      }
    }
  }
</style>

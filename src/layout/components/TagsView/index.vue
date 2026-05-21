<template>
  <div
    class="tabs-view"
    :class="{
      'tabs-view-fix': multiTabsSetting.fixed,
      'tabs-view-fixed-header': isMultiHeaderFixed,
      'tabs-view-default-background': !getDarkTheme,
      'tabs-view-dark-background': getDarkTheme,
    }"
    :style="getChangeStyle"
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
          <Draggable :list="tabsList" animation="300" item-key="fullPath" class="flex">
            <template #item="{ element }">
              <div
                :id="`tag${element.fullPath.split('/').join('\\/')}`"
                class="tabs-card-scroll-item"
                :class="{ 'active-item': activeKey === element.fullPath }"
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
      <div class="tabs-close">
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
    unref,
  } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { storage } from '@/utils/Storage';
  import { TABS_ROUTES } from '@/store/mutation-types';
  import { useTabsViewStore } from '@/store/modules/tabsView';
  import type { RouteItem } from '@/store/modules/tabsView';
  import { useProjectSetting } from '@/hooks/setting/useProjectSetting';
  import { useDesignSetting } from '@/hooks/setting/useDesignSetting';
  import { useProjectSettingStore } from '@/store/modules/projectSetting';
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
  import { renderIcon } from '@/utils/layout';
  import elementResizeDetectorMaker from 'element-resize-detector';

  export default defineComponent({
    name: 'TabsView',
    components: { DownOutlined, CloseOutlined, LeftOutlined, RightOutlined, Draggable },
    props: {
      collapsed: { type: Boolean },
    },
    setup(props) {
      const { getDarkTheme, getAppTheme } = useDesignSetting();
      const { navMode, headerSetting, menuSetting, multiTabsSetting, isMobile } = useProjectSetting();
      const settingStore = useProjectSettingStore();
      const message = useMessage();
      const route = useRoute();
      const router = useRouter();
      const tabsViewStore = useTabsViewStore();
      const whiteList = ['Login', 'Redirect', 'ErrorPage'];

      const navScroll = ref<HTMLElement | null>(null);
      const navWrap = ref<HTMLElement | null>(null);
      const isCurrent = ref(false);

      const themeVars = useThemeVars();
      const getCardColor = computed(() => themeVars.value.cardColor);
      const getBaseColor = computed(() => themeVars.value.textColor1);

      const state = reactive({
        activeKey: route.fullPath,
        scrollable: false,
        dropdownX: 0,
        dropdownY: 0,
        showDropdown: false,
        isMultiHeaderFixed: false,
        multiTabsSetting,
      });

      // ---- 简化的路由信息提取 ----
      const getSimpleRoute = (r: any): RouteItem => {
        const { fullPath, hash, meta, name, params, path, query } = r;
        return { fullPath, hash, meta, name, params, path, query };
      };

      const isMixMenuNoneSub = computed(() => {
        if (unref(navMode) !== 'horizontal-mix') return true;
        const mixMenu = settingStore.menuSetting.mixMenu;
        return !(mixMenu && (route.meta as any)?.isRoot);
      });

      const getChangeStyle = computed(() => {
        const { collapsed } = props;
        const { minMenuWidth, menuWidth } = unref(menuSetting);
        const { fixed } = unref(multiTabsSetting);
        let lenNum =
          unref(navMode) === 'horizontal' || !isMixMenuNoneSub.value
            ? '0px'
            : collapsed
              ? `${minMenuWidth}px`
              : `${menuWidth}px`;
        if (isMobile.value) {
          return { left: '0px', width: '100%' };
        }
        return {
          left: lenNum,
          width: `calc(100% - ${!fixed ? '0px' : lenNum})`,
        };
      });

      const TabsMenuOptions = computed(() => {
        const isDisabled = tabsList.value.length <= 1;
        return [
          { label: '刷新当前', key: '1', icon: renderIcon(ReloadOutlined) },
          { label: '关闭当前', key: '2', disabled: isCurrent.value || isDisabled, icon: renderIcon(CloseOutlined) },
          { label: '关闭其他', key: '3', disabled: isDisabled, icon: renderIcon(ColumnWidthOutlined) },
          { label: '关闭全部', key: '4', disabled: isDisabled, icon: renderIcon(MinusOutlined) },
        ];
      });

      // ---- 初始化标签页（从 localStorage 恢复）----
      let cacheRoutes: RouteItem[] = [];
      const simpleRoute = getSimpleRoute(route);
      try {
        const routesStr = storage.get(TABS_ROUTES) as string | null | undefined;
        cacheRoutes = routesStr ? JSON.parse(routesStr) : [simpleRoute];
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

      // 滚动监听（用于固定多标签头部）
      function onScroll(e: Event) {
        const scrollTop =
          (e.target as HTMLElement).scrollTop ||
          document.documentElement.scrollTop ||
          window.pageYOffset ||
          document.body.scrollTop;
        state.isMultiHeaderFixed = !!(
          !headerSetting.value.fixed &&
          multiTabsSetting.value.fixed &&
          scrollTop >= 64
        );
      }
      const tabsList = computed(() => tabsViewStore.tabsList);

      // 路由变化时添加标签
      watch(
        () => [route.fullPath, route.name],
        ([fullPath, name]) => {
          if (!name || whiteList.includes(name as string)) return;
          
          // 只有当当前路由是 matched 数组中的最后一个时才添加（即叶子节点）
          // 并且排除掉带有重定向的中间级路由
          const lastMatched = route.matched[route.matched.length - 1];
          const isLeaf = route.matched.length > 0 && lastMatched.name === name;
          const hasRedirect = route.redirect || route.meta?.redirect || lastMatched.redirect;
          
          if (!isLeaf || hasRedirect) return;

          state.activeKey = fullPath as string;
          tabsViewStore.addTab(getSimpleRoute(route));
          updateNavScroll(true);
        },
        { immediate: true },
      );

      // 页面刷新前保存标签
      const saveTabsBeforeUnload = () => {
        storage.set(TABS_ROUTES, JSON.stringify(tabsList.value));
      };

      // ---- 关闭操作 ----
      const reloadPage = () => {
        router.push({ path: '/redirect' + route.fullPath });
      };
      provide('reloadPage', reloadPage);

      const removeTab = (r: any) => {
        if (tabsList.value.length === 1) {
          return message.warning('这已经是最后一页，不能再关闭了！');
        }
        // 关闭前先找到相邻 tab（前一个优先）
        const closingIndex = tabsList.value.findIndex((item) => item.fullPath === r.fullPath);
        const adjacentTab =
          tabsList.value[closingIndex - 1] || tabsList.value[closingIndex + 1];

        tabsViewStore.closeCurrentTab(r);

        if (state.activeKey === r.fullPath && adjacentTab) {
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
            ([...tagList] as HTMLElement[]).forEach((tag) => {
              if (tag.id === `tag${state.activeKey.split('/').join('\\/')}`) {
                tag.scrollIntoView && tag.scrollIntoView();
              }
            });
          }
        } else {
          state.scrollable = false;
        }
      }

      const currentContextItem = ref<any>(null);

      function handleContextMenu(e: MouseEvent, item: any) {
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

      function goPage(e: any) {
        const { fullPath } = e;
        if (fullPath === route.fullPath) return;
        state.activeKey = fullPath;
        router.push(e);
      }

      function closeTabItem(e: any) {
        const { fullPath } = e;
        const routeInfo = tabsList.value.find((item) => item.fullPath === fullPath);
        if (routeInfo) removeTab(routeInfo);
      }

      let erdObserver: any = null;

      onMounted(() => {
        erdObserver = elementResizeDetectorMaker();
        if (navWrap.value) {
          erdObserver.listenTo(navWrap.value, () => updateNavScroll(true));
        }
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('beforeunload', saveTabsBeforeUnload);
      });

      onUnmounted(() => {
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('beforeunload', saveTabsBeforeUnload);
        if (erdObserver && navWrap.value) {
          erdObserver.uninstall(navWrap.value);
        }
      });

      return {
        ...toRefs(state),
        navWrap,
        navScroll,
        route,
        tabsList,
        goPage,
        closeTabItem,
        closeAll,
        reloadPage,
        getChangeStyle,
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
    padding: 6px 0;
    display: flex;
    transition: all 0.2s ease-in-out;

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

  .tabs-view-default-background { background: #f5f7f9; }
  .tabs-view-dark-background    { background: #101014; }

  .tabs-view-fix {
    position: fixed;
    z-index: 5;
    padding: 6px 10px;
  }

  .tabs-view-fixed-header { top: 0; }
</style>

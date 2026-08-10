<template>
  <RouterView v-slot="{ Component }">
    <transition :name="getTransitionName" mode="out-in" appear>
      <keep-alive :include="cachedNames" :max="15">
        <component :is="Component" :key="viewKey" />
      </keep-alive>
    </transition>
  </RouterView>
</template>

<script lang="ts" setup>
  import { computed, unref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useProjectSetting } from '@/hooks/setting/useProjectSetting';
  import { usePageReload } from '@/hooks/usePageReload';
  import { useTabsViewStore } from '@/store/modules/tabsView';

  const route = useRoute();
  const tabsViewStore = useTabsViewStore();
  const { isPageAnimate, pageAnimateType } = useProjectSetting();
  const { viewKey } = usePageReload();

  const getTransitionName = computed(() =>
    unref(isPageAnimate) ? unref(pageAnimateType) : '',
  );

  /**
   * 对齐 guanweb cachedViews：随标签开闭同步。
   * 当前页若开启 keepAlive，立刻并入 include，避免首进尚未写入 store 时漏缓存。
   */
  const cachedNames = computed(() => {
    const names = [...tabsViewStore.cachedViews];
    if (route.meta?.keepAlive && route.name) {
      const current = String(route.name);
      if (!names.includes(current))
        names.push(current);
    }
    return names;
  });
</script>

<template>
  <RouterView v-slot="{ Component }">
    <transition :name="getTransitionName" mode="out-in" appear>
      <keep-alive :include="cachedNames" :max="15">
        <component
          :is="Component"
          v-if="pageAlive"
          :key="viewKey"
        />
      </keep-alive>
    </transition>
  </RouterView>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { usePageReload } from '@/hooks/usePageReload';

  const route = useRoute();
  const tabsViewStore = useTabsViewStore();
  const settingStore = useProjectSettingStore();
  const { viewKey, reloadingName, pageAlive } = usePageReload();

  const getTransitionName = computed(() =>
    settingStore.isPageAnimate ? settingStore.pageAnimateType : '',
  );

  /**
   * keep-alive 缓存列表：随标签开闭同步。
   * 当前页若开启 keepAlive，立刻并入 include，避免首进尚未写入 store 时漏缓存。
   * 刷新中的 name 必须排除，否则踢缓存无效（见 usePageReload）。
   */
  const cachedNames = computed(() => {
    const reloading = reloadingName.value;
    const names = tabsViewStore.cachedViews.filter(n => n !== reloading);
    if (route.meta?.keepAlive && route.name) {
      const current = String(route.name);
      if (current !== reloading && !names.includes(current))
        names.push(current);
    }
    return names;
  });
</script>

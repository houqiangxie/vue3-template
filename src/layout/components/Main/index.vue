<template>
  <RouterView v-slot="{ Component }">
    <transition :name="getTransitionName" mode="out-in" appear>
      <keep-alive :max="15">
        <component :is="Component" />
      </keep-alive>
    </transition>
  </RouterView>
</template>

<script lang="ts" setup>
  import { computed, unref } from 'vue';
  import { useProjectSetting } from '@/hooks/setting/useProjectSetting';

  const { isPageAnimate, pageAnimateType } = useProjectSetting();

  const getTransitionName = computed(() =>
    unref(isPageAnimate) ? unref(pageAnimateType) : '',
  );
</script>

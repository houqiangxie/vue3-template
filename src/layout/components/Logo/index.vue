<template>
  <div v-if="showLogo" class="logo">
    <img :src="websiteConfig.logo" alt="logo" :class="{ 'mr-2': !collapsed }" />
    <h2 v-show="!collapsed" class="title">{{ websiteConfig.title }}</h2>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { websiteConfig } from '@/config/website.config';

  defineProps<{ collapsed?: boolean }>();

  const settingStore = useProjectSettingStore();
  const showLogo = computed(() => settingStore.showLogo);
</script>

<style lang="scss" scoped>
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;
    line-height: 64px;
    overflow: hidden;
    white-space: nowrap;

    img {
      width: auto;
      height: 32px;
    }

    .title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
</style>

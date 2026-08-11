<template>
  <div v-if="show" class="app-watermark" aria-hidden="true">
    <div
      v-for="i in 36"
      :key="i"
      class="app-watermark-item"
    >
      {{ text }}
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProjectSettingStore } from '@/store/modules/projectSetting';
  import { websiteConfig } from '@/config/website.config';

  const settingStore = useProjectSettingStore();

  const show = computed(() => settingStore.watermark.show);

  const text = computed(() => {
    const custom = settingStore.watermark.text?.trim();
    if (custom) return custom;
    const user = (local as any).token?.userName;
    return user || websiteConfig.title;
  });
</script>

<style lang="scss" scoped>
  .app-watermark {
    position: fixed;
    inset: 0;
    z-index: 9998;
    pointer-events: none;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(9, 1fr);
    overflow: hidden;
    opacity: 0.12;
  }

  .app-watermark-item {
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-24deg);
    font-size: 14px;
    white-space: nowrap;
    user-select: none;
    color: #000;
  }

  :global(html.dark) .app-watermark-item {
    color: #fff;
  }
</style>

<template>
  <div class="home-index system-page">
    <n-card :bordered="false">
      <h1 class="home-index__title">{{ websiteConfig.title }}</h1>
      <p class="home-index__desc">{{ websiteConfig.loginDesc }}</p>
      <p class="home-index__hint">
        开发默认走本地 Mock（任意账号可登录）；对接真实后端请使用
        <code>pnpm dev:api</code>
        或将
        <code>VITE_USE_MOCK</code>
        设为
        <code>false</code>
        。
      </p>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { websiteConfig } from '@/config/website.config'
</script>

<style scoped>
.home-index__title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
}

.home-index__desc {
  margin: 0 0 12px;
  color: var(--n-text-color-3);
  font-size: 14px;
}

.home-index__hint {
  margin: 0;
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.6;
}

.home-index__hint code {
  margin: 0 2px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--n-code-color);
  font-size: 12px;
}
</style>

<template>
  <div class="page">
    <h2 class="title">{{ websiteConfig.title }}</h2>
    <p class="desc">{{ websiteConfig.loginDesc }}</p>
  </div>
</template>

<script setup lang="ts">
import { websiteConfig } from '@/config/website.config'
</script>

<style scoped>
.page {
  padding: 16px;
}

.title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.desc {
  margin: 0;
  color: #666;
  font-size: 14px;
}
</style>

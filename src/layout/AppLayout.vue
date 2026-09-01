<template>
  <!-- App 入口仅作 H5 预留，不接入 web 后台布局与 projectSetting 配置 -->
  <div class="app-layout">
    <router-view />
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.app-layout {
  min-height: var(--app-vh, 100vh);
  min-height: var(--app-dvh, 100dvh);
  box-sizing: border-box;
}
</style>

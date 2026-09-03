<template>
  <div class="iframe-host h-full w-full overflow-auto">
    <!--
      多系统切换时靠路由 keep-alive 保留各 IFrame 实例；
      同一实例内仅挂一个 iframe，src 只在 base 变化时更新，子路由靠 postMessage 同步。
    -->
    <iframe
      v-if="iframeSrc"
      ref="iframeRef"
      class="iframe-host__frame w-full border-0"
      :class="{ 'iframe-host__frame--fill': frameHeight == null }"
      :src="iframeSrc"
      :style="iframeStyle"
      frameborder="0"
      allowfullscreen
      @load="onIframeLoad"
    />
    <div v-else class="iframe-host__empty">
      未配置 iframe 地址（meta.iFrameUrl）
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIframeHost } from '@/hooks/useIframeHost'

defineOptions({ name: 'CommonIFrame' })

const {
  iframeRef,
  iframeSrc,
  iframeStyle,
  frameHeight,
  onIframeLoad,
} = useIframeHost()
</script>

<style scoped>
.iframe-host__frame--fill {
  height: 100%;
  min-height: 100%;
}

.iframe-host__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--n-text-color-3, #999);
  font-size: 14px;
}
</style>

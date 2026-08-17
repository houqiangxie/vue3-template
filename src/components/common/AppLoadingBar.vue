<!--
  标签栏下方页面进度条：用 n-progress，由 loadingStore 驱动。
-->
<template>
  <div
    class="app-loading-bar"
    :class="{ 'app-loading-bar--active': visible }"
    aria-hidden="true"
  >
    <n-progress
      type="line"
      :percentage="percent"
      :show-indicator="false"
      :height="2"
      :border-radius="0"
      :color="barColor"
      rail-color="transparent"
      :processing="visible && percent < 100"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from 'vue'

const loadingStore = useLoadingStore()
const designStore = useDesignSettingStore()

const barColor = computed(() => designStore.appTheme || '#18a058')

const visible = ref(false)
const percent = ref(0)

let trickleTimer: ReturnType<typeof setInterval> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function clearTrickle() {
  if (trickleTimer != null) {
    clearInterval(trickleTimer)
    trickleTimer = null
  }
}

function clearHide() {
  if (hideTimer != null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function start() {
  clearHide()
  clearTrickle()
  visible.value = true
  percent.value = 0
  requestAnimationFrame(() => {
    percent.value = 12
  })
  trickleTimer = setInterval(() => {
    if (percent.value >= 92)
      return
    const remain = 92 - percent.value
    percent.value += Math.max(0.4, remain * 0.08)
  }, 320)
}

function done() {
  clearTrickle()
  percent.value = 100
  hideTimer = setTimeout(() => {
    visible.value = false
    percent.value = 0
    hideTimer = null
  }, 220)
}

watch(
  () => loadingStore.showLoading,
  (show) => {
    if (show)
      start()
    else if (visible.value)
      done()
  },
  { immediate: true },
)

onScopeDispose(() => {
  clearTrickle()
  clearHide()
})
</script>

<style scoped lang="scss">
.app-loading-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.18s ease;

  &--active {
    opacity: 1;
  }

  :deep(.n-progress) {
    display: block;
  }

  :deep(.n-progress-content) {
    margin: 0;
  }
}
</style>

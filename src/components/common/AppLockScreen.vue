<template>
  <div v-if="locked" class="app-lock-screen">
    <div class="app-lock-screen-panel">
      <n-avatar round :size="72">{{ avatarText }}</n-avatar>
      <div class="app-lock-screen-name">{{ username }}</div>
      <n-input
        v-model:value="password"
        type="password"
        show-password-on="click"
        placeholder="点击解锁（隐私遮罩，非密码校验）"
        @keyup.enter="unlock"
      />
      <n-button type="primary" block @click="unlock">解锁</n-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { useProjectSettingStore } from '@/store/modules/projectSetting';

  const LOCK_KEY = '__app_locked__';
  const settingStore = useProjectSettingStore();

  const locked = ref(false);
  const password = ref('');
  let timer: ReturnType<typeof setTimeout> | null = null;

  const username = computed(() => (local as any).token?.userName ?? '用户');
  const avatarText = computed(() => {
    const name = username.value;
    return name ? name.charAt(0).toUpperCase() : 'U';
  });

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function resetTimer() {
    clearTimer();
    if (!settingStore.lockScreen.enabled || locked.value) return;
    const ms = Math.max(1, settingStore.lockScreen.timeout || 30) * 60 * 1000;
    timer = setTimeout(() => {
      lock();
    }, ms);
  }

  function lock() {
    locked.value = true;
    password.value = '';
    try {
      sessionStorage.setItem(LOCK_KEY, '1');
    } catch {}
    clearTimer();
  }

  function unlock() {
    locked.value = false;
    password.value = '';
    try {
      sessionStorage.removeItem(LOCK_KEY);
    } catch {}
    resetTimer();
  }

  function onActivity() {
    if (!locked.value) resetTimer();
  }

  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

  watch(
    () => [settingStore.lockScreen.enabled, settingStore.lockScreen.timeout],
    () => {
      if (settingStore.lockScreen.enabled) {
        resetTimer();
      } else {
        clearTimer();
        if (locked.value) unlock();
      }
    },
  );

  onMounted(() => {
    try {
      if (sessionStorage.getItem(LOCK_KEY) === '1' && settingStore.lockScreen.enabled) {
        locked.value = true;
      }
    } catch {}
    activityEvents.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    resetTimer();
  });

  onUnmounted(() => {
    clearTimer();
    activityEvents.forEach((e) => window.removeEventListener(e, onActivity));
  });
</script>

<style lang="scss" scoped>
  .app-lock-screen {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(16, 16, 20, 0.72);
    backdrop-filter: blur(8px);
  }

  .app-lock-screen-panel {
    width: 320px;
    padding: 32px 28px;
    border-radius: 12px;
    background: var(--n-color, #fff);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  }

  .app-lock-screen-name {
    font-size: 16px;
    font-weight: 600;
  }
</style>

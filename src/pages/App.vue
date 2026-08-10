<template>
  <n-config-provider
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    :theme="getDarkTheme ? darkTheme : lightTheme"
    :theme-overrides="themeOverrides"
  >
    <n-dialog-provider>
      <n-message-provider>
        <RegisterMessage />
        <AppWatermark />
        <AppLockScreen />
        <n-spin :show="commonStore.showLoading">
          <router-view />
        </n-spin>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, watch, watchEffect, onMounted, onUnmounted } from 'vue';
import {
  lightTheme,
  darkTheme,
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS,
} from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';
import { useCommonStore } from '@/store/common';
import AppWatermark from '@/components/common/AppWatermark.vue';
import AppLockScreen from '@/components/common/AppLockScreen.vue';
import { useDesignSettingStore } from '@/store/modules/designSetting';
import { useProjectSettingStore } from '@/store/modules/projectSetting';
import { lighten } from '@/utils/layout';

const commonStore = useCommonStore();
const designStore = useDesignSettingStore();
const projectStore = useProjectSettingStore();

const getDarkTheme = computed(() => designStore.darkTheme);

const naiveLocale = computed(() => (projectStore.locale === 'en-US' ? enUS : zhCN));
const naiveDateLocale = computed(() => (projectStore.locale === 'en-US' ? dateEnUS : dateZhCN));

function applySystemTheme() {
  if (!designStore.followSystem) return;
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  designStore.setDarkTheme(dark);
}

function applyBodyFilters() {
  const filters: string[] = [];
  if (designStore.grayMode) filters.push('grayscale(100%)');
  if (designStore.colorWeak) filters.push('invert(80%)');
  document.documentElement.style.filter = filters.length ? filters.join(' ') : '';
}

watchEffect(() => {
  const dark = designStore.darkTheme;
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.body.style.backgroundColor = dark ? '#101014' : '#fff';
  applyBodyFilters();
});

watch(
  () => designStore.followSystem,
  (val) => {
    if (val) applySystemTheme();
  },
  { immediate: true },
);

let mediaQuery: MediaQueryList | null = null;
function onSystemThemeChange(e: MediaQueryListEvent) {
  if (designStore.followSystem) {
    designStore.setDarkTheme(e.matches);
  }
}

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', onSystemThemeChange);
});

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', onSystemThemeChange);
});

const themeOverrides = computed<GlobalThemeOverrides>(() => {
  const appTheme = designStore.appTheme;
  const lightenStr = lighten(appTheme, 6);
  const radius = `${designStore.borderRadius}px`;
  const compact = designStore.compact;
  return {
    common: {
      primaryColor: appTheme,
      primaryColorHover: lightenStr,
      primaryColorPressed: lightenStr,
      primaryColorSuppl: appTheme,
      borderRadius: radius,
      borderRadiusSmall: radius,
      heightMedium: compact ? '28px' : undefined,
      heightSmall: compact ? '22px' : undefined,
      fontSize: compact ? '13px' : undefined,
    },
    Button: compact
      ? {
          heightMedium: '28px',
          heightSmall: '22px',
          fontSizeMedium: '13px',
        }
      : undefined,
    DataTable: compact
      ? {
          thPaddingMedium: '8px',
          tdPaddingMedium: '8px',
        }
      : undefined,
  };
});

projectStore.$subscribe((_mutation, state) => {
  try {
    const { isMobile: _isMobile, ...rest } = state;
    localStorage.setItem('__project_setting__', JSON.stringify(rest));
  } catch {}
}, { detached: true });

designStore.$subscribe((_mutation, state) => {
  try {
    localStorage.setItem('__design_setting__', JSON.stringify({
      darkTheme: state.darkTheme,
      followSystem: state.followSystem,
      appTheme: state.appTheme,
      grayMode: state.grayMode,
      colorWeak: state.colorWeak,
      borderRadius: state.borderRadius,
      compact: state.compact,
    }));
  } catch {}
}, { detached: true });
</script>

<style lang="scss">
.n-spin-content {
  opacity: 1 !important;
}
.n-scrollbar-rail__scrollbar {
  z-index: 999;
}

::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: #aaa;
}
::-webkit-scrollbar-track {
  border-radius: 0;
  background: rgba(0, 0, 0, 0);
}
</style>

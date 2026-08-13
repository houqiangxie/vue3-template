<template>
  <n-config-provider
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    :theme="getDarkTheme ? darkTheme : lightTheme"
    :theme-overrides="themeOverrides"
  >
    <component
      :is="designStore.showThemeEditor ? NThemeEditor : Passthrough"
      :key="designStore.showThemeEditor ? designStore.themeEditorEpoch : 'app'"
    >
      <n-dialog-provider>
        <n-message-provider>
          <RegisterMessage />
          <AppUpdater />
          <AppWatermark />
          <AppLockScreen />
          <n-spin :show="loadingStore.showLoading">
            <router-view />
          </n-spin>
        </n-message-provider>
      </n-dialog-provider>
    </component>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, defineComponent } from 'vue';
import {
  lightTheme,
  darkTheme,
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS,
  NThemeEditor,
} from 'naive-ui';

import AppUpdater from '@/components/common/AppUpdater.vue';
import AppWatermark from '@/components/common/AppWatermark.vue';
import AppLockScreen from '@/components/common/AppLockScreen.vue';

import { useAppThemeOverrides } from '@/hooks/setting/useAppThemeOverrides';
import { useAppThemeEffects } from '@/hooks/setting/useAppThemeEffects';

const Passthrough = defineComponent({
  name: 'ThemeEditorPassthrough',
  setup(_, { slots }) {
    return () => slots.default?.();
  },
});

const loadingStore = useLoadingStore();
const designStore = useDesignSettingStore();
const projectStore = useProjectSettingStore();
const { themeOverrides } = useAppThemeOverrides();
useAppThemeEffects();

const getDarkTheme = computed(() => designStore.darkTheme);

const naiveLocale = computed(() => (projectStore.locale === 'en-US' ? enUS : zhCN));
const naiveDateLocale = computed(() => (projectStore.locale === 'en-US' ? dateEnUS : dateZhCN));
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

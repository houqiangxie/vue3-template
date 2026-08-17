<template>
  <n-config-provider
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    :theme="getDarkTheme ? darkTheme : lightTheme"
    :theme-overrides="themeOverrides"
  >
    <component
      :is="themeShell"
      :key="designStore.showThemeEditor ? designStore.themeEditorEpoch : 'app'"
    >
      <n-dialog-provider>
        <n-message-provider>
          <RegisterMessage />
          <AppWatermark />
          <AppLockScreen />
          <router-view />
        </n-message-provider>
      </n-dialog-provider>
    </component>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, defineComponent } from 'vue';
import {
  lightTheme,
  darkTheme,
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS,
} from 'naive-ui';

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

const AsyncThemeEditor = defineAsyncComponent(() =>
  import('naive-ui').then(m => m.NThemeEditor),
);

const designStore = useDesignSettingStore();
const projectStore = useProjectSettingStore();
const { themeOverrides } = useAppThemeOverrides();
useAppThemeEffects();

const getDarkTheme = computed(() => designStore.darkTheme);
const themeShell = computed(() =>
  designStore.showThemeEditor ? AsyncThemeEditor : Passthrough,
);

const naiveLocale = computed(() => (projectStore.locale === 'en-US' ? enUS : zhCN));
const naiveDateLocale = computed(() => (projectStore.locale === 'en-US' ? dateEnUS : dateZhCN));
</script>

<style lang="scss">
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

<template>
  <n-config-provider
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    :theme="getDarkTheme ? darkTheme : lightTheme"
    :theme-overrides="themeOverrides"
    :hljs="hljs"
  >
    <component
      :is="themeShell"
      :key="designStore.showThemeEditor ? designStore.themeEditorEpoch : 'app'"
    >
      <n-dialog-provider>
        <n-message-provider>
          <n-notification-provider>
            <RegisterMessage />
            <AppUpdater v-if="inElectron" />
            <AppWatermark />
            <AppLockScreen />
            <div class="app-shell">
              <router-view />
            </div>
          </n-notification-provider>
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
import { isElectron } from '@/utils/electron';
import { hljs } from '@/utils/hljs';

import { I18N_ENABLED } from '@/i18n/config';
import { useAppThemeOverrides } from '@/hooks/setting/useAppThemeOverrides';
import { useAppThemeEffects } from '@/hooks/setting/useAppThemeEffects';

const Passthrough = defineComponent({
  name: 'ThemeEditorPassthrough',
  setup(_, { slots }) {
    return () => slots.default?.();
  },
});

/** Theme editor is heavy — only pull the chunk when enabled. */
const AsyncThemeEditor = defineAsyncComponent(() =>
  import('naive-ui').then(m => m.NThemeEditor),
);

const AppUpdater = defineAsyncComponent(() =>
  import('@/components/common/AppUpdater.vue'),
);

const inElectron = isElectron();

const designStore = useDesignSettingStore();
const projectStore = useProjectSettingStore();
const { themeOverrides } = useAppThemeOverrides();
useAppThemeEffects();

const getDarkTheme = computed(() => designStore.darkTheme);
const themeShell = computed(() =>
  designStore.showThemeEditor ? AsyncThemeEditor : Passthrough,
);

/** 未启用业务 i18n 时界面走中文 fallback，Naive 组件（含 NThemeEditor）同步强制中文 */
const naiveLocale = computed(() =>
  I18N_ENABLED && projectStore.locale === 'en-US' ? enUS : zhCN,
);
const naiveDateLocale = computed(() =>
  I18N_ENABLED && projectStore.locale === 'en-US' ? dateEnUS : dateZhCN,
);
</script>

<template>
  <n-config-provider
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    :theme="getDarkTheme ? darkTheme : lightTheme"
    :theme-overrides="themeOverrides"
    :hljs="hljs"
  >
    <n-dialog-provider>
      <n-message-provider>
        <n-notification-provider>
          <RegisterMessage />
          <div class="app-shell">
            <router-view />
          </div>
        </n-notification-provider>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
/**
 * App / H5 预留入口。
 * 不挂载锁屏、水印、主题编辑器，也不消费 web 后台布局配置（navMode / sider 等）。
 */
import { computed } from 'vue';
import {
  lightTheme,
  darkTheme,
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS,
} from 'naive-ui';

import { hljs } from '@/utils/hljs';
import { I18N_ENABLED } from '@/i18n/config';
import { useAppThemeOverrides } from '@/hooks/setting/useAppThemeOverrides';
import { useAppThemeEffects } from '@/hooks/setting/useAppThemeEffects';

const designStore = useDesignSettingStore();
const projectStore = useProjectSettingStore();
const { themeOverrides } = useAppThemeOverrides();
useAppThemeEffects({ persistProjectSetting: false });

const getDarkTheme = computed(() => designStore.darkTheme);

/** 未启用业务 i18n 时界面走中文 fallback，Naive 组件同步强制中文 */
const naiveLocale = computed(() =>
  I18N_ENABLED && projectStore.locale === 'en-US' ? enUS : zhCN,
);
const naiveDateLocale = computed(() =>
  I18N_ENABLED && projectStore.locale === 'en-US' ? dateEnUS : dateZhCN,
);
</script>

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
          <div class="bpm-shell app-shell">
            <router-view />
          </div>
        </n-notification-provider>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
/**
 * BPM 独立入口：与 WebApp 共用 designSetting（主色 / 深浅色 / 圆角等），
 * 保证 n-button、n-modal 等 Naive 组件颜色与 web 主题同步。
 */
import { computed } from 'vue'
import {
  lightTheme,
  darkTheme,
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS,
} from 'naive-ui'
import RegisterMessage from '@/components/common/RegisterMessage.vue'
import { hljs } from '@/utils/hljs'
import { I18N_ENABLED } from '@/i18n/config'
import { useAppThemeOverrides } from '@/hooks/setting/useAppThemeOverrides'
import { useAppThemeEffects } from '@/hooks/setting/useAppThemeEffects'

defineOptions({ name: 'BpmApp' })

const designStore = useDesignSettingStore()
const projectStore = useProjectSettingStore()
const { themeOverrides } = useAppThemeOverrides()
useAppThemeEffects({ persistProjectSetting: false })

const getDarkTheme = computed(() => designStore.darkTheme)

const naiveLocale = computed(() =>
  I18N_ENABLED && projectStore.locale === 'en-US' ? enUS : zhCN,
)
const naiveDateLocale = computed(() =>
  I18N_ENABLED && projectStore.locale === 'en-US' ? dateEnUS : dateZhCN,
)
</script>

<style scoped>
.bpm-shell {
  min-height: 100vh;
  background: var(--n-color, transparent);
}
.bpm-shell :deep(.bpm-layout) {
  min-height: 100vh;
}
</style>

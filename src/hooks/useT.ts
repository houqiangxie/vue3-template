import { computed } from 'vue'
import { globalLocale, t as standaloneT } from '@/i18n/t'
import { I18N_ENABLED } from '@/i18n/config'

/**
 * 业务国际化 composable（插拔式）
 * - 启用 VITE_ENABLE_I18N 时走 vue-i18n（由 setupI18n 注入），locale 切换会触发 computed 更新
 * - 未启用时 t() 返回第二参数 fallback，不加载 vue-i18n 运行时
 */
export function useT() {
  return {
    t: standaloneT,
    locale: globalLocale,
    enabled: I18N_ENABLED,
  }
}

/** 语言选项（设置面板等） */
export function useLocaleOptions() {
  const { t, locale } = useT()
  return computed(() => {
    void locale.value
    return [
      { label: t('common.localeZhCN', '简体中文'), value: 'zh-CN' as const },
      { label: t('common.localeEnUS', 'English'), value: 'en-US' as const },
    ]
  })
}

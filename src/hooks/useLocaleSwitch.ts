import { computed } from 'vue'
import type { AppLocale } from '@/i18n/types'
import { resolveAppLocale } from '@/i18n/config'
import { useLocaleOptions, useT } from '@/hooks/useT'

/** 切换界面语言 / 语言包（同步 Naive UI locale 与 vue-i18n） */
export function useLocaleSwitch() {
  const settingStore = useProjectSettingStore()
  const localeOptions = useLocaleOptions()
  const { t, locale } = useT()

  const currentLocale = computed(() => settingStore.locale)

  const currentLabel = computed(() => {
    void locale.value
    const hit = localeOptions.value.find(opt => opt.value === currentLocale.value)
    return hit?.label ?? currentLocale.value
  })

  const currentShortLabel = computed(() =>
    currentLocale.value === 'en-US' ? 'EN' : '中',
  )

  function setLocale(value: AppLocale | string) {
    settingStore.setLocale(resolveAppLocale(value))
  }

  return {
    localeOptions,
    currentLocale,
    currentLabel,
    currentShortLabel,
    setLocale,
    t,
  }
}

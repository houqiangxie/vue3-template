import { ref } from 'vue'
import type { I18n } from 'vue-i18n'
import { I18N_ENABLED } from './config'
import { interpolate } from './interpolate'
import type { AppLocale } from './types'

let i18nInstance: I18n | null = null

/** 供未启用 i18n 时的 composable 订阅 locale 变化 */
export const globalLocale = ref<AppLocale>('zh-CN')

export function bindI18n(instance: I18n | null) {
  i18nInstance = instance
}

export function setGlobalLocale(locale: AppLocale) {
  globalLocale.value = locale
}

/**
 * 业务文案翻译（插拔式）
 * @param key 语言包 key，如 login.usernamePlaceholder
 * @param defaultValue 未启用 i18n 或缺少翻译时的兜底文案（建议始终传入）
 * @param params 占位符，如 { depth: 2 }
 */
export function t(
  key: string,
  defaultValue?: string,
  params?: Record<string, unknown>,
): string {
  void globalLocale.value

  const fallback = defaultValue ?? key

  if (I18N_ENABLED && i18nInstance) {
    const translate = i18nInstance.global.t as (
      key: string,
      params?: Record<string, unknown>,
    ) => string
    const result = translate(key, params ?? {})
    if (result !== key)
      return String(result)
  }

  return interpolate(fallback, params)
}

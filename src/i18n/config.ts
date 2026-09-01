import { DEFAULT_LOCALE } from './types'
import type { AppLocale } from './types'

/** 构建时注入：true 启用 vue-i18n 业务文案；false 时 t() 仅返回 fallback，不加载 vue-i18n */
export const I18N_ENABLED = import.meta.env.VITE_ENABLE_I18N === 'true'

export function resolveAppLocale(value: unknown): AppLocale {
  return value === 'en-US' ? 'en-US' : DEFAULT_LOCALE
}

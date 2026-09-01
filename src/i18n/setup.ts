import type { App } from 'vue'
import type { I18n } from 'vue-i18n'
import { watch } from 'vue'
import { I18N_ENABLED } from './config'
import { loadLocaleMessages } from './loadLocale'
import { bindI18n, setGlobalLocale } from './t'
import { DEFAULT_LOCALE, type AppLocale } from './types'

let i18nInstance: I18n | null = null

async function ensureLocaleMessages(i18n: I18n, locale: AppLocale) {
  const available = i18n.global.availableLocales as string[]
  if (available.includes(locale))
    return
  const messages = await loadLocaleMessages(locale)
  i18n.global.setLocaleMessage(locale, messages)
}

async function switchLocale(locale: AppLocale) {
  if (!i18nInstance)
    return
  await ensureLocaleMessages(i18nInstance, locale)
  const globalLocaleRef = i18nInstance.global.locale as string | { value: string }
  if (typeof globalLocaleRef === 'object')
    globalLocaleRef.value = locale
  else
    i18nInstance.global.locale = locale
  setGlobalLocale(locale)
}

function watchProjectLocale() {
  const projectStore = useProjectSettingStore()
  setGlobalLocale(projectStore.locale)

  watch(
    () => projectStore.locale,
    (next) => {
      if (I18N_ENABLED && i18nInstance)
        void switchLocale(next)
      else
        setGlobalLocale(next)
    },
  )
}

/** 在 Pinia 安装后调用；未启用时仅同步 locale ref，不加载 vue-i18n */
export async function setupI18n(app: App): Promise<void> {
  if (!I18N_ENABLED) {
    bindI18n(null)
    // 关闭 i18n 时无语言切换入口，避免持久化的 en-US 让 Naive 主题编辑器等仍显示英文
    const projectStore = useProjectSettingStore()
    if (projectStore.locale !== DEFAULT_LOCALE)
      projectStore.setLocale(DEFAULT_LOCALE)
    watchProjectLocale()
    return
  }

  const { createI18n } = await import('vue-i18n')
  const projectStore = useProjectSettingStore()
  const locale = projectStore.locale
  const messages = await loadLocaleMessages(locale)

  i18nInstance = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'zh-CN',
    messages: { [locale]: messages },
    missingWarn: import.meta.env.DEV,
    fallbackWarn: false,
  })

  app.use(i18nInstance)
  bindI18n(i18nInstance)
  setGlobalLocale(locale)
  watchProjectLocale()
}

import type { LocaleMessageDictionary } from 'vue-i18n'
import type { AppLocale } from './types'

export type LocaleMessages = LocaleMessageDictionary

type LocaleModule = { default: Record<string, unknown> }

const localeModuleLoaders = import.meta.glob<LocaleModule>('@/locales/*/*.ts')

const LOCALE_PATH_RE = /\/locales\/([^/]+)\/([^/]+)\.ts$/

function parseLocalePath(path: string): { locale: string, namespace: string } | null {
  const match = path.match(LOCALE_PATH_RE)
  if (!match)
    return null
  return { locale: match[1], namespace: match[2] }
}

export async function loadLocaleMessages(locale: AppLocale): Promise<LocaleMessages> {
  const entries = Object.entries(localeModuleLoaders).filter(([path]) => {
    const parsed = parseLocalePath(path)
    return parsed?.locale === locale && parsed.namespace !== 'index'
  })

  const messages: Record<string, unknown> = {}

  await Promise.all(
    entries.map(async ([path, loadModule]) => {
      const { namespace } = parseLocalePath(path)!
      const mod = await loadModule()
      messages[namespace] = mod.default
    }),
  )

  return messages
}

import type { App } from 'vue'
import type { Router } from 'vue-router'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import emitter from '@/utils/emitter'
import { setupDirectives } from '@/directive'

export interface BootstrapOptions {
  rootComponent: Parameters<typeof createApp>[0]
  router: Router
  mountSelector: string
  /** web 端需要注入 naive-ui-style meta，避免与 UnoCSS 冲突 */
  injectNaiveStyleMeta?: boolean
  setup?: (app: App) => void | Promise<void>
}

/**
 * web / app 共用启动流程
 */
export async function createBootstrap(options: BootstrapOptions) {
  const {
    rootComponent,
    router,
    mountSelector,
    injectNaiveStyleMeta = false,
    setup,
  } = options

  const app = createApp(rootComponent)
  app.config.globalProperties.$emitter = emitter

  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  setupDirectives(app)

  await setup?.(app)
  await router.isReady()

  if (injectNaiveStyleMeta) {
    const meta = document.createElement('meta')
    meta.name = 'naive-ui-style'
    document.head.appendChild(meta)
  }

  app.mount(mountSelector)
  return app
}

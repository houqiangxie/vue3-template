/**
 * BPM 入口只注册项目自有组件与指令，模板直接写 n-*（Naive UI 由 unplugin 解析）。
 */
import type { App, Plugin } from 'vue'
import { Dialog } from '@/components/Dialog'
import { ContentWrap } from '@/components/ContentWrap'
import { Icon } from '@/components/Icon'
import { XButton, XTextButton } from '@/components/XButton'
import BpmDictTag from '@/components/bpm/DictTag.vue'
import { loadingDirective } from '@/directives/loading'
import { mountedFocusDirective } from '@/directives/mountedFocus'

const components: Record<string, unknown> = {
  Dialog,
  ContentWrap,
  Icon,
  DictTag: BpmDictTag,
  XButton,
  XTextButton,
}

export function setupBpmComponents(app: App) {
  Object.entries(components).forEach(([name, comp]) => {
    app.component(name, comp as Plugin)
  })
  app.directive('loading', loadingDirective)
  app.directive('mountedFocus', mountedFocusDirective)
}

import type { App } from 'vue'
import { hasPermi } from './permission/hasPermi'
import { hasRole } from './permission/hasRole'
import { loadingDirective } from './loading'
import { mountedFocusDirective } from './mountedFocus'

export function setupDirectives(app: App) {
  app.directive('hasPermi', hasPermi)
  app.directive('hasRole', hasRole)
  app.directive('loading', loadingDirective)
  app.directive('mountedFocus', mountedFocusDirective)
}

export { hasPermi, hasRole, loadingDirective, mountedFocusDirective }

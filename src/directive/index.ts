import type { App } from 'vue'
import { hasPermi } from './permission/hasPermi'
import { hasRole } from './permission/hasRole'

export function setupDirectives(app: App) {
  app.directive('hasPermi', hasPermi)
  app.directive('hasRole', hasRole)
}

export { hasPermi, hasRole }

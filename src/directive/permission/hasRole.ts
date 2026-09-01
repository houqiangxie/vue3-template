import type { Directive, DirectiveBinding } from 'vue'
import { matchAny, SUPER_ROLE } from '@/store/permission'

function checkRole(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const { value } = binding
  const required = Array.isArray(value) ? value : value ? [value] : []

  if (!required.length) {
    throw new Error('v-hasRole 需要角色标识，如 v-hasRole="\'admin\'"')
  }

  const ok = matchAny(usePermissionStore().userRoles, required, SUPER_ROLE)
  if (!ok)
    el.parentNode?.removeChild(el)
}

export const hasRole: Directive = {
  mounted: checkRole,
}

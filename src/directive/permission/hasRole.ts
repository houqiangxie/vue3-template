import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/store/modules/permission'

function checkRole(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const { value } = binding
  const roles = usePermissionStore().userRoles
  const required = Array.isArray(value) ? value : value ? [value] : []

  if (!required.length) {
    throw new Error('v-hasRole 需要角色标识，如 v-hasRole="\'admin\'"')
  }

  const ok = roles.includes('admin') || required.some(r => roles.includes(r))
  if (!ok)
    el.parentNode?.removeChild(el)
}

export const hasRole: Directive = {
  mounted: checkRole,
}

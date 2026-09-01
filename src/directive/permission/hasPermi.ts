import type { Directive, DirectiveBinding } from 'vue'
import { matchAny, SUPER_PERMISSION } from '@/store/permission'

function checkPermi(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const { value } = binding
  const required = Array.isArray(value) ? value : value ? [value] : []

  if (!required.length) {
    throw new Error('v-hasPermi 需要权限标识，如 v-hasPermi="\'system:user:add\'"')
  }

  const ok = matchAny(usePermissionStore().userPermissions, required, SUPER_PERMISSION)
  if (!ok)
    el.parentNode?.removeChild(el)
}

export const hasPermi: Directive = {
  mounted: checkPermi,
}

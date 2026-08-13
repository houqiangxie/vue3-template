import type { Directive, DirectiveBinding } from 'vue'

function checkPermi(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const { value } = binding
  const permissions = usePermissionStore().userPermissions
  const required = Array.isArray(value) ? value : value ? [value] : []

  if (!required.length) {
    throw new Error('v-hasPermi 需要权限标识，如 v-hasPermi="\'system:user:add\'"')
  }

  const ok = permissions.includes('*:*:*') || required.some(p => permissions.includes(p))
  if (!ok)
    el.parentNode?.removeChild(el)
}

export const hasPermi: Directive = {
  mounted: checkPermi,
}

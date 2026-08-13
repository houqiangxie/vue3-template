
function matchAny(owned: string[], required: string[], superCode?: string): boolean {
  if (!owned.length)
    return false
  if (superCode && owned.includes(superCode))
    return true
  return required.some(item => owned.includes(item))
}

/** 检查是否拥有指定权限 / 角色 */
export function usePermission() {
  const permissionStore = usePermissionStore()

  function hasPermission(perm: string | string[]): boolean {
    const required = Array.isArray(perm) ? perm : [perm]
    // 权限尚未加载或为空：默认拒绝（fail-closed），避免未鉴权时按钮全开
    return matchAny(permissionStore.userPermissions, required, '*:*:*')
  }

  function hasRole(role: string | string[]): boolean {
    const required = Array.isArray(role) ? role : [role]
    return matchAny(permissionStore.userRoles, required, 'admin')
  }

  return { hasPermission, hasRole }
}

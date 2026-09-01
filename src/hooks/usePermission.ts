import { matchAny, SUPER_PERMISSION, SUPER_ROLE } from '@/store/permission'

/** 检查是否拥有指定权限 / 角色 */
export function usePermission() {
  const permissionStore = usePermissionStore()

  function hasPermission(perm: string | string[]): boolean {
    return matchAny(permissionStore.userPermissions, perm, SUPER_PERMISSION)
  }

  function hasRole(role: string | string[]): boolean {
    return matchAny(permissionStore.userRoles, role, SUPER_ROLE)
  }

  return { hasPermission, hasRole }
}

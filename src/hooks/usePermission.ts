import { usePermissionStore } from '@/store/modules/permission'

/** 检查是否拥有指定权限（参照若依 v-hasPermi） */
export function usePermission() {
  const permissionStore = usePermissionStore()

  function hasPermission(perm: string | string[]): boolean {
    const perms = permissionStore.userPermissions
    // 权限尚未加载或为空：默认拒绝（fail-closed），避免未鉴权时按钮全开
    if (!perms.length)
      return false
    if (perms.includes('*:*:*'))
      return true
    const required = Array.isArray(perm) ? perm : [perm]
    return required.some(p => perms.includes(p))
  }

  return { hasPermission }
}

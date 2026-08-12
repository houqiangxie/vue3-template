import type { MenuItem } from '@/router/utils/types'
import { get } from '@/utils/fetch'

export interface UserInfo {
  userId: number
  userName: string
  nickName: string
  avatar?: string
}

export interface GetInfoResult {
  user: UserInfo
  roles: string[]
  permissions: string[]
}

/** 获取当前用户信息与权限标识 */
export function getInfo() {
  return get<GetInfoResult>('/getInfo')
}

/** 获取当前用户动态路由菜单 */
export function getRouters() {
  return get<MenuItem[]>('/getRouters')
}

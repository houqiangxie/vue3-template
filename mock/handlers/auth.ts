import type { MockRoute } from '../utils'
import { fail, ok } from '../utils'
import { menus, roles, routerMenus } from '../data/store'

const ALL_PERMS = '*:*:*'

function collectPerms(roleIds: number[]): string[] {
  if (roleIds.includes(1))
    return [ALL_PERMS]

  const menuIdSet = new Set<number>()
  roles.filter(r => roleIds.includes(r.roleId)).forEach((r) => {
    r.menuIds?.forEach(id => menuIdSet.add(id))
  })
  return menus
    .filter(m => menuIdSet.has(m.menuId) && m.perms)
    .map(m => m.perms!)
}

export const authRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/ManageUser/createCodeImage',
    handler: () => ({ __raw: true, contentType: 'image/svg+xml', body: mockCaptchaSvg() }),
  },
  {
    method: 'POST',
    path: '/ManageUser/login',
    handler: (req) => {
      const username = String(req.body?.username || req.body?.name || '')
      if (!username)
        return fail('用户名不能为空', 500)
      // mock 任意账号密码均可登录；admin 拥有全部权限
      return ok({
        token: `mock-token-${username}`,
        refreshToken: `mock-refresh-${username}`,
        expiresIn: 7200,
        username,
      })
    },
  },
  {
    method: 'GET',
    path: '/getInfo',
    handler: () => {
      return ok({
        user: {
          userId: 1,
          userName: 'admin',
          nickName: '超级管理员',
          avatar: '',
        },
        roles: ['admin'],
        permissions: collectPerms([1]),
      })
    },
  },
  {
    method: 'GET',
    path: '/getRouters',
    handler: () => ok(routerMenus),
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: (req) => {
      const refreshToken = String(req.body?.refreshToken || '')
      if (!refreshToken.startsWith('mock-refresh-'))
        return fail('refresh token 无效或已过期', 401)
      const username = refreshToken.slice('mock-refresh-'.length) || 'admin'
      return ok({
        token: `mock-token-${username}`,
        refreshToken: `mock-refresh-${username}`,
        expiresIn: 7200,
      })
    },
  },
]

function mockCaptchaSvg() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++)
    code += chars[Math.floor(Math.random() * chars.length)]
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="112" height="40" viewBox="0 0 112 40">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f2744"/>
      <stop offset="100%" stop-color="#163a5f"/>
    </linearGradient>
  </defs>
  <rect width="112" height="40" rx="6" fill="url(#g)"/>
  <path d="M0 12 Q28 4 56 16 T112 10" stroke="#2d8cf033" fill="none"/>
  <path d="M0 28 Q40 34 70 20 T112 30" stroke="#1c90dc33" fill="none"/>
  <text x="56" y="26" fill="#dbeafe" font-size="18" font-family="Segoe UI, monospace" font-weight="600" letter-spacing="4" text-anchor="middle">${code}</text>
</svg>`
}

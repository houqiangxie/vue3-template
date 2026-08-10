import type { Plugin } from 'vite'
import type { MockRoute } from './utils'
import { matchPath, parseQuery, readBody, sendJson } from './utils'
import { authRoutes } from './handlers/auth'
import { configRoutes } from './handlers/config'
import { deptRoutes } from './handlers/dept'
import { dictRoutes } from './handlers/dict'
import { jobRoutes } from './handlers/job'
import { logininforRoutes } from './handlers/logininfor'
import { menuRoutes } from './handlers/menu'
import { noticeRoutes } from './handlers/notice'
import { onlineRoutes } from './handlers/online'
import { operlogRoutes } from './handlers/operlog'
import { postRoutes } from './handlers/post'
import { roleRoutes } from './handlers/role'
import { userRoutes } from './handlers/user'

const routes: MockRoute[] = [
  ...authRoutes,
  ...userRoutes,
  ...roleRoutes,
  ...menuRoutes,
  ...deptRoutes,
  ...dictRoutes,
  ...noticeRoutes,
  ...postRoutes,
  ...configRoutes,
  ...operlogRoutes,
  ...logininforRoutes,
  ...jobRoutes,
  ...onlineRoutes,
]
/**
 * 开发环境 Mock 插件：拦截 /api/*，业务代码无需改动。
 * 通过 VITE_USE_MOCK=true 启用；关闭后走 Vite proxy 真实接口。
 */
export function mockApiPlugin(apiPrefix = '/api'): Plugin {
  return {
    name: 'vite-plugin-local-mock',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || ''
        if (!rawUrl.startsWith(apiPrefix))
          return next()

        const method = (req.method || 'GET').toUpperCase()
        const pathnameWithQuery = rawUrl.slice(apiPrefix.length) || '/'
        const qIndex = pathnameWithQuery.indexOf('?')
        const pathname = (qIndex >= 0 ? pathnameWithQuery.slice(0, qIndex) : pathnameWithQuery) || '/'
        const query = parseQuery(pathnameWithQuery)

        for (const route of routes) {
          if (route.method !== method)
            continue
          const params = matchPath(route.path, pathname)
          if (!params)
            continue

          try {
            const body = method === 'GET' || method === 'HEAD' ? {} : await readBody(req)
            const payload = await route.handler({
              method,
              url: rawUrl,
              pathname,
              query,
              params,
              body,
            })

            if (payload?.__raw) {
              res.statusCode = 200
              res.setHeader('Content-Type', payload.contentType || 'text/plain')
              res.end(payload.body)
              return
            }

            sendJson(res, payload)
          }
          catch (error: any) {
            sendJson(res, {
              code: 500,
              data: null,
              message: error?.message || 'Mock 服务异常',
            })
          }
          return
        }

        sendJson(res, {
          code: 404,
          data: null,
          message: `Mock 未实现: ${method} ${pathname}`,
        })
      })
    },
  }
}

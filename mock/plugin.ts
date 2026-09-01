import type { Plugin, ViteDevServer } from 'vite'
import type { MockRoute } from './utils.ts'
import { matchPath, parseQuery, readBody, sendJson, sendStream } from './utils.ts'

/**
 * 开发环境 Mock 插件：拦截 /api/*，业务代码无需改动。
 * 通过 VITE_USE_MOCK=true 启用；关闭后走 Vite proxy 真实接口。
 * 每次请求通过 ssrLoadModule 加载路由，修改 mock/handlers 后无需整服重启。
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

        let routes: MockRoute[]
        try {
          routes = await loadMockRoutes(server)
        }
        catch (error: any) {
          sendJson(res, {
            code: 500,
            data: null,
            message: error?.message || 'Mock 路由加载失败',
          })
          return
        }

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
              if (payload.headers) {
                for (const [key, value] of Object.entries(payload.headers as Record<string, string>))
                  res.setHeader(key, value)
              }
              res.end(payload.body)
              return
            }

            if (payload?.__stream) {
              await sendStream(res, payload, req)
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

async function loadMockRoutes(server: ViteDevServer): Promise<MockRoute[]> {
  const mod = await server.ssrLoadModule('/mock/routes.ts')
  const getMockRoutes = mod.getMockRoutes as () => MockRoute[]
  return getMockRoutes()
}

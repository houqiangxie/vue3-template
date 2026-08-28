import type { MockRoute } from './utils'
import { aiRoutes } from './handlers/ai'
import { authRoutes } from './handlers/auth'
import { cacheRoutes } from './handlers/cache'
import { configRoutes } from './handlers/config'
import { dashboardRoutes } from './handlers/dashboard'
import { deptRoutes } from './handlers/dept'
import { dictRoutes } from './handlers/dict'
import { genRoutes } from './handlers/gen'
import { jobRoutes } from './handlers/job'
import { logininforRoutes } from './handlers/logininfor'
import { menuRoutes } from './handlers/menu'
import { messageRoutes } from './handlers/message'
import { noticeRoutes } from './handlers/notice'
import { onlineRoutes } from './handlers/online'
import { operlogRoutes } from './handlers/operlog'
import { postRoutes } from './handlers/post'
import { roleRoutes } from './handlers/role'
import { serverRoutes } from './handlers/server'
import { userRoutes } from './handlers/user'

/** 汇总全部 Mock 路由 */
export function getMockRoutes(): MockRoute[] {
  return [
    ...authRoutes,
    ...dashboardRoutes,
    ...messageRoutes,
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
    ...serverRoutes,
    ...cacheRoutes,
    ...genRoutes,
    ...aiRoutes,
  ]
}

import type { Router } from 'vue-router'

/** 主应用与独立 BPM MPA 路由名兼容 */
export function resolveBpmRouteName(router: Router, webName: string, bpmName: string) {
  if (router.hasRoute(webName))
    return webName
  if (router.hasRoute(bpmName))
    return bpmName
  return webName
}

/** 跳转流程详情（兼容主应用 / BPM 独立站） */
export function pushBpmProcessDetail(
  router: Router,
  query: { id: string, taskId?: string, activityId?: string },
) {
  const name = resolveBpmRouteName(router, 'Bpm-ProcessInstanceDetail', 'BpmProcessInstanceDetail')
  return router.push({ name, query })
}

/** 跳转发起流程 */
export function pushBpmProcessCreate(
  router: Router,
  query?: { processInstanceId?: string },
) {
  const name = resolveBpmRouteName(router, 'Bpm-ProcessInstanceCreate', 'BpmProcessInstanceCreate')
  return router.push({ name, query: query || {} })
}

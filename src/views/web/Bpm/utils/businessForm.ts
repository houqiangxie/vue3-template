import type { Router } from 'vue-router'
import { defineAsyncComponent, type Component } from 'vue'

/** 主应用 views 下的业务表单组件（含 Bpm/oa/...） */
const webViewModules = import.meta.glob('/src/views/web/**/*.vue')

function normalizeComponentPath(raw: string): string[] {
  let p = String(raw || '').trim().replace(/\\/g, '/')
  if (!p)
    return []
  p = p.replace(/^\.?\//, '')
  if (!p.endsWith('.vue'))
    p = `${p}.vue`

  const candidates = new Set<string>()
  candidates.add(p)
  candidates.add(p.replace(/^src\/views\/web\//i, ''))
  candidates.add(p.replace(/^views\/web\//i, ''))
  // bpm/oa/leave/detail.vue → Bpm/oa/leave/detail.vue
  if (/^bpm\//i.test(p))
    candidates.add(`Bpm/${p.slice(4)}`)
  if (!/^Bpm\//i.test(p) && !/^bpm\//i.test(p))
    candidates.add(`Bpm/${p}`)

  return [...candidates]
}

function findModuleLoader(raw: string): (() => Promise<any>) | null {
  const keys = Object.keys(webViewModules)
  for (const candidate of normalizeComponentPath(raw)) {
    const hit = keys.find((k) => {
      const norm = k.replace(/\\/g, '/')
      return norm.endsWith(`/views/web/${candidate}`)
        || norm.endsWith(`/views/web/${candidate.replace(/^Bpm\//i, 'Bpm/')}`)
    })
    if (hit)
      return webViewModules[hit] as () => Promise<any>
  }
  return null
}

/** 解析业务查看组件（formCustomViewPath） */
export function resolveBusinessFormComponent(path?: string): Component | null {
  if (!path || /^https?:\/\//i.test(path))
    return null
  const loader = findModuleLoader(path)
  if (!loader)
    return null
  return defineAsyncComponent(loader)
}

/** 是否能以内嵌组件方式打开 */
export function canEmbedBusinessForm(path?: string): boolean {
  if (!path || /^https?:\/\//i.test(path))
    return false
  return !!findModuleLoader(path)
}

/**
 * 打开业务发起/跳转路径（formCustomCreatePath）
 * 优先：外链 → 已注册路由 → 组件路径对应页面路由
 */
export function openBusinessFormPath(
  router: Router,
  path: string,
  query?: Record<string, string>,
): boolean {
  const raw = String(path || '').trim()
  if (!raw)
    return false

  if (/^https?:\/\//i.test(raw)) {
    window.open(raw, '_blank')
    return true
  }

  // 已是绝对/相对路由
  const asRoute = raw.startsWith('/') ? raw : `/${raw.replace(/\.vue$/i, '')}`
  const tryPaths: string[] = [
    asRoute,
    asRoute.replace(/^\/bpm\//i, '/Bpm/'),
    `/Bpm/${raw.replace(/^\/?bpm\//i, '').replace(/\.vue$/i, '')}`,
  ]

  // 组件路径映射到已知 OA 页
  const lower = raw.toLowerCase().replace(/\\/g, '/')
  if (lower.includes('oa/leave/create'))
    tryPaths.unshift('/Bpm/oa/leave/create')
  if (lower.includes('oa/leave/detail'))
    tryPaths.unshift('/Bpm/oa/leave/detail')

  for (const p of tryPaths) {
    try {
      const resolved = router.resolve({ path: p, query })
      if (resolved.matched.length > 0) {
        router.push({ path: p, query })
        return true
      }
    }
    catch {
      // continue
    }
  }

  // 按路由名尝试（仅请假发起）
  if (lower.includes('oa/leave/create')) {
    const nameCandidates = ['Bpm-LeaveCreate', 'BpmLeaveCreate']
    for (const name of nameCandidates) {
      if (router.hasRoute(name)) {
        router.push({ name, query })
        return true
      }
    }
  }

  return false
}

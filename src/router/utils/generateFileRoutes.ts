import type { RouteRecordRaw } from 'vue-router'

type LazyComponent = () => Promise<any>

/** Per-route configuration for redirects and extra meta. */
export interface RouteConfig {
  /** Vue Router redirect for this route. */
  redirect?: RouteRecordRaw['redirect']
  /** Extra meta fields merged on top of `defaultMeta`. */
  meta?: Record<string, any>
}

export interface GenerateFileRoutesOptions {
  /**
   * Meta applied to every generated route.
   * Can be overridden per route via `routeConfig`.
   */
  defaultMeta?: Record<string, any>
  /**
   * Per-route overrides keyed by **route name** (e.g. `'Index'`, `'Index-Home-HomeIndex'`).
   * Use this to set redirects, titles, permission requirements, etc.
   */
  routeConfig?: Record<string, RouteConfig>
  /**
   * Optional callback executed for every built route.
   * Return a modified copy; do not mutate the `route` argument directly.
   */
  extendRoute?: (route: RouteRecordRaw, parent: RouteRecordRaw | null) => RouteRecordRaw
}

/**
 * Generate nested Vue Router routes from the result of `import.meta.glob`.
 *
 * ### Conventions (mirrors vite-plugin-pages defaults)
 * | Rule | Detail |
 * |---|---|
 * | **Route name** | Path segments joined with `"-"` → `Index-Home-HomeIndex` |
 * | **Route path** | Lower-case filename; root-level `"index"` (case-insensitive) → `"/"` |
 * | **Nesting** | A `.vue` file + a same-named directory → layout component + children |
 *
 * ### Example
 * ```
 * src/views/web/
 *   Index.vue                 → { path: '/',           name: 'Index' }
 *   Index/Home.vue            → { path: 'home',        name: 'Index-Home' }
 *   Index/Home/HomeIndex.vue  → { path: 'homeindex',   name: 'Index-Home-HomeIndex' }
 *   Index/Home/PersonInfo.vue → { path: 'personinfo',  name: 'Index-Home-PersonInfo' }
 * ```
 *
 * @param modules   Result of `import.meta.glob('/src/views/web/** /*.vue')`
 * @param baseDir   Base directory prefix to strip, e.g. `'/src/views/web/'`
 * @param options   Optional config: defaultMeta, per-route overrides, extendRoute hook
 */
export function generateFileRoutes(
  modules: Record<string, LazyComponent>,
  baseDir: string,
  options: GenerateFileRoutesOptions = {}
): RouteRecordRaw[] {
  const { defaultMeta = {}, routeConfig = {}, extendRoute } = options

  // Ensure trailing slash
  const normalizedBase = baseDir.endsWith('/') ? baseDir : `${baseDir}/`

  // Build map: relative path (no .vue extension) → lazy loader
  // e.g. 'Index' → loader,  'Index/Home' → loader
  const fileMap = new Map<string, LazyComponent>()
  for (const [key, loader] of Object.entries(modules)) {
    if (!key.startsWith(normalizedBase)) continue
    fileMap.set(key.slice(normalizedBase.length).replace(/\.vue$/, ''), loader)
  }

  /**
   * Recursively build a `RouteRecordRaw` for the given relative path.
   * @param rel     e.g. `'Index'`, `'Index/Home'`, `'Index/Home/HomeIndex'`
   * @param parent  Parent route (null for root-level routes)
   */
  function buildRoute(rel: string, parent: RouteRecordRaw | null): RouteRecordRaw {
    const segments = rel.split('/')
    const lastName  = segments[segments.length - 1]

    // Route name: 'Index/Home/HomeIndex' → 'Index-Home-HomeIndex'
    const name = segments.join('-')

    // Route path:
    //   - root-level file named "index" (case-insensitive) → '/'
    //   - any other root-level file → '/lowercase-name'
    //   - nested file → 'lowercase-name' (relative to parent)
    const path =
      segments.length === 1 && lastName.toLowerCase() === 'index'
        ? '/'
        : lastName.toLowerCase()

    // Direct children: files exactly one level deeper inside this "directory"
    const childRels = [...fileMap.keys()].filter((k) => {
      const kSegs = k.split('/')
      return (
        kSegs.length === segments.length + 1 &&
        kSegs.slice(0, segments.length).join('/') === rel
      )
    })

    const cfg = routeConfig[name] ?? {}

    const route: RouteRecordRaw = {
      path,
      name,
      component: fileMap.get(rel)!,
      meta: { ...defaultMeta, ...cfg.meta },
      ...(cfg.redirect != null ? { redirect: cfg.redirect } : {}),
    }

    if (childRels.length) {
      route.children = childRels.map((c) => buildRoute(c, route))
    }

    return extendRoute ? extendRoute(route, parent) : route
  }

  // Start with root-level files (no slash in their relative path)
  const rootRels = [...fileMap.keys()].filter((k) => !k.includes('/'))
  return rootRels.map((r) => buildRoute(r, null))
}

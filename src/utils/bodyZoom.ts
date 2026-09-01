/**
 * 按系统 / 浏览器缩放倍率，反向设置 body.zoom。
 * 例：放大 3 倍（devicePixelRatio === 3）→ zoom = 1/3。
 *
 * 同步写入 --app-body-zoom；壳层用 --app-vw / --app-vh / --app-dvh
 * （= 100vw|vh|dvh / zoom）抵消 zoom 导致的宽高不足（见 styles/app-shell.css）。
 *
 * Naive UI 浮层依赖 vueuc binder；弹窗拖动 / 表格列宽拖拽依赖对应 composable。
 * body.zoom 会打乱视觉坐标与布局坐标，由 Vite 插件
 * scripts/vite-plugin-vueuc-body-zoom.ts 在构建期注入修正（不锁依赖版本）。
 */

export type BodyZoomOptions = {
  /** 是否启用，默认 true */
  enabled?: boolean
  /**
   * 基准 DPR。zoom = baseRatio / devicePixelRatio。
   * 默认 1：DPR=1.5 → zoom≈0.667；DPR=3 → zoom≈0.333。
   */
  baseRatio?: number
  /**
   * 作用平台。`all`（默认）全平台；`windows` 仅 Windows。
   */
  platforms?: 'windows' | 'all'
}

function isWindows(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const platform = nav.userAgentData?.platform || navigator.platform || ''
  return /Win/i.test(platform) || /Windows/i.test(navigator.userAgent)
}

function resolveScale(): number {
  const dpr = window.devicePixelRatio
  return dpr > 0 ? dpr : 1
}

/** 计算应施加的 zoom 值 */
export function calcBodyZoom(baseRatio = 1): number {
  const scale = resolveScale()
  if (scale <= 0)
    return 1
  return baseRatio / scale
}

/** 立即写入 body.style.zoom，返回实际 zoom */
export function applyBodyZoom(baseRatio = 1): number {
  const zoom = calcBodyZoom(baseRatio)
  document.body.style.zoom = String(zoom)
  document.documentElement.style.setProperty('--app-body-zoom', String(zoom))
  return zoom
}

/** 清除 body zoom */
export function clearBodyZoom(): void {
  document.body.style.removeProperty('zoom')
  document.documentElement.style.removeProperty('--app-body-zoom')
}

/**
 * 读取当前 body CSS zoom（布局坐标 = 视觉坐标 / zoom）。
 * 优先 --app-body-zoom，其次 inline style。
 */
export function getBodyCssZoom(): number {
  if (typeof document === 'undefined')
    return 1
  const fromVar = document.documentElement.style.getPropertyValue('--app-body-zoom').trim()
  if (fromVar) {
    const n = parseFloat(fromVar)
    if (n > 0)
      return n
  }
  try {
    const computed = getComputedStyle(document.documentElement).getPropertyValue('--app-body-zoom').trim()
    if (computed) {
      const n = parseFloat(computed)
      if (n > 0)
        return n
    }
  }
  catch {
    // ignore
  }
  const inline = document.body?.style?.zoom
  if (inline) {
    const n = parseFloat(String(inline))
    if (n > 0)
      return n
  }
  return 1
}

/**
 * 将 CSS 尺寸里的视口单位换算为 body.zoom 补偿值。
 * 例：`70vh` → `calc(70vh / var(--app-body-zoom, 1))`；纯 px / % 原样返回。
 */
export function compensateViewportCssSize(value: string): string {
  if (!/(?:vh|dvh|vw|dvw|vmin|vmax)\b/i.test(value))
    return value
  return value.replace(
    /(-?[\d.]+)(vh|dvh|vw|dvw|vmin|vmax)\b/gi,
    (_m, n: string, unit: string) => `calc(${n}${unit} / var(--app-body-zoom, 1))`,
  )
}

/**
 * 启动并监听 DPR / 视口变化；返回卸载函数。
 * 应在 web 入口尽早调用（body 已存在即可）。
 */
export function setupBodyZoomCompensation(options: BodyZoomOptions = {}): () => void {
  const { enabled = true, baseRatio = 1, platforms = 'all' } = options
  const active = enabled && (platforms === 'all' || isWindows())

  if (!active) {
    clearBodyZoom()
    return () => undefined
  }

  const sync = () => {
    applyBodyZoom(baseRatio)
  }

  sync()

  window.addEventListener('resize', sync)
  window.visualViewport?.addEventListener('resize', sync)
  window.visualViewport?.addEventListener('scroll', sync)

  let dprQuery: MediaQueryList | null = null

  const rebindDprQuery = () => {
    dprQuery?.removeEventListener('change', onDprChange)
    dprQuery = window.matchMedia(`(resolution: ${resolveScale()}dppx)`)
    dprQuery.addEventListener('change', onDprChange)
  }

  const onDprChange = () => {
    sync()
    rebindDprQuery()
  }

  rebindDprQuery()

  return () => {
    window.removeEventListener('resize', sync)
    window.visualViewport?.removeEventListener('resize', sync)
    window.visualViewport?.removeEventListener('scroll', sync)
    dprQuery?.removeEventListener('change', onDprChange)
    clearBodyZoom()
  }
}

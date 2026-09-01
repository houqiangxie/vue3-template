/**
 * 构建时注入 body.zoom 坐标修正：
 * 1) vueuc binder utils（Select / DatePicker 等浮层定位）
 * 2) naive-ui modal useDragModal（弹窗拖动范围与位移）
 * 3) naive-ui DataTable 列宽：仅 zoom≠1 时补偿；zoom=1 走原生逻辑
 *
 * Vite 8 预构建会把 naive-ui 打成整包导致子路径 transform 失效，
 * 因此 exclude naive-ui / vueuc，走本插件 transform。
 */
import type { Plugin } from 'vite'

const VUEUC_MARK = '/* __vueuc_body_zoom_patch__ */'
const MODAL_MARK = '/* __naive_modal_body_zoom_patch__ */'
const HEADER_MARK = '/* __naive_table_header_body_zoom_patch_v6__ */'

const GET_BODY_CSS_ZOOM = `function getBodyCssZoom() {
  const inline = document.body && document.body.style && document.body.style.zoom;
  if (inline) {
    const n = parseFloat(inline);
    if (n > 0) return n;
  }
  try {
    const computed = getComputedStyle(document.body).zoom;
    if (computed && computed !== 'normal') {
      const n = parseFloat(computed);
      if (n > 0) return n;
    }
  } catch (e) {}
  try {
    const fromVar = getComputedStyle(document.documentElement).getPropertyValue('--app-body-zoom').trim();
    if (fromVar) {
      const n = parseFloat(fromVar);
      if (n > 0) return n;
    }
  } catch (e) {}
  return 1;
}
`

const VUEUC_HELPER = `${VUEUC_MARK}
${GET_BODY_CSS_ZOOM}`

function isVueucBinderUtils(id: string): boolean {
  const norm = id.replace(/\\/g, '/')
  return norm.includes('/vueuc/') && /\/binder\/src\/utils\.js(?:\?|$)/.test(norm)
}

function isNaiveModalComposables(id: string): boolean {
  const norm = id.replace(/\\/g, '/')
  return norm.includes('/naive-ui/') && /\/modal\/src\/composables\.m?js(?:\?|$)/.test(norm)
}

function isNaiveTableHeader(id: string): boolean {
  const norm = id.replace(/\\/g, '/')
  return norm.includes('/naive-ui/') && /\/data-table\/src\/TableParts\/Header\.m?js(?:\?|$)/.test(norm)
}

const GET_POINT_RECT_BODY = `function getPointRect(x, y) {
    const zoom = getBodyCssZoom();
    const viewRect = ensureViewBoundingRect();
    const left = x / zoom;
    const top = y / zoom;
    return {
        top,
        left,
        height: 0,
        width: 0,
        right: viewRect.width / zoom - left,
        bottom: viewRect.height / zoom - top
    };
}`

const GET_RECT_BODY = `function getRect(el) {
    const zoom = getBodyCssZoom();
    const elRect = el.getBoundingClientRect();
    const viewRect = ensureViewBoundingRect();
    return {
        left: (elRect.left - viewRect.left) / zoom,
        top: (elRect.top - viewRect.top) / zoom,
        bottom: (viewRect.height + viewRect.top - elRect.bottom) / zoom,
        right: (viewRect.width + viewRect.left - elRect.right) / zoom,
        width: elRect.width / zoom,
        height: elRect.height / zoom
    };
}`

/** 把 getBoundingClientRect 视觉坐标换算成 body.zoom 下的布局坐标 */
export function applyVueucBodyZoomPatch(code: string): string | null {
  if (code.includes(VUEUC_MARK))
    return code

  const hasGetRect = /\bfunction getRect\s*\(/.test(code)
  const hasGetPointRect = /\bfunction getPointRect\s*\(/.test(code)
  if (!hasGetRect || !hasGetPointRect) {
    console.warn(
      '[body-zoom] vueuc binder/src/utils.js 结构变化，未能注入 zoom 修正；Select/DatePicker 在 body.zoom 下可能错位',
    )
    return null
  }

  let next = code
  if (/let viewMeasurer = null;/.test(next))
    next = next.replace(/let viewMeasurer = null;/, (m) => `${m}\n${VUEUC_HELPER}`)
  else
    next = `${VUEUC_HELPER}\n${next}`

  next = next.replace(
    /(export\s+)?function getPointRect\s*\(\s*x\s*,\s*y\s*\)\s*\{[\s\S]*?\n\}/,
    (_m, exp: string | undefined) => `${exp || ''}${GET_POINT_RECT_BODY}`,
  )

  next = next.replace(
    /(export\s+)?function getRect\s*\(\s*el\s*\)\s*\{[\s\S]*?\n\}/,
    (_m, exp: string | undefined) => `${exp || ''}${GET_RECT_BODY}`,
  )

  if (!next.includes('getBodyCssZoom()')) {
    console.warn('[body-zoom] vueuc 注入失败：未能改写 getRect/getPointRect')
    return null
  }

  return next
}

/**
 * Modal 拖动：getBoundingClientRect / clientX 是视觉坐标，
 * style.left/top 是布局坐标，需统一除以 body.zoom。
 */
export function applyNaiveModalBodyZoomPatch(code: string): string | null {
  if (code.includes(MODAL_MARK))
    return code

  if (!/\buseDragModal\b/.test(code) || !/getBoundingClientRect/.test(code))
    return null

  if (!/maxMoveX\s*=\s*window\.innerWidth\s*-\s*right/.test(code)) {
    console.warn(
      '[body-zoom] naive-ui modal composables 结构变化，未能注入拖动 zoom 修正',
    )
    return null
  }

  let next = `${MODAL_MARK}\n${GET_BODY_CSS_ZOOM}\n${code}`

  next = next.replace(
    /minMoveX\s*=\s*x;\s*minMoveY\s*=\s*y;\s*maxMoveX\s*=\s*window\.innerWidth\s*-\s*right;\s*maxMoveY\s*=\s*window\.innerHeight\s*-\s*bottom;/,
    `const __bodyZoom = getBodyCssZoom();
      minMoveX = x / __bodyZoom;
      minMoveY = y / __bodyZoom;
      maxMoveX = (window.innerWidth - right) / __bodyZoom;
      maxMoveY = (window.innerHeight - bottom) / __bodyZoom;`,
  )

  next = next.replace(
    /let moveX\s*=\s*event\.clientX\s*-\s*downX;\s*let moveY\s*=\s*event\.clientY\s*-\s*downY;/,
    `const __bodyZoomMove = getBodyCssZoom();
      let moveX = (event.clientX - downX) / __bodyZoomMove;
      let moveY = (event.clientY - downY) / __bodyZoomMove;`,
  )

  if (!next.includes('__bodyZoom') || !next.includes('__bodyZoomMove')) {
    console.warn('[body-zoom] naive-ui modal 注入失败：未能改写 useDragModal 坐标计算')
    return null
  }

  return next
}

function buildHeaderResizeFns(useCjsClamp: boolean): string {
  const clampCall = useCjsClamp
    ? '(0, utils_1.clampValueFollowCSSRules)(widthAfterResize, column.minWidth, column.maxWidth)'
    : 'clampValueFollowCSSRules(widthAfterResize, column.minWidth, column.maxWidth)'
  return `function handleColumnResizeStart(column) {
      const zoom = getBodyCssZoom();
      if (zoom === 1) {
        resizeStartWidthMap.set(column.key, getCellActualWidth(column.key));
        return;
      }
      const element = cellElsRef.value[column.key];
      if (!element)
        return;
      resizeStartWidthMap.set(column.key, element.offsetWidth);
    }
    function handleColumnResize(column, displacementX) {
      const startWidth = resizeStartWidthMap.get(column.key);
      if (startWidth === undefined) {
        return;
      }
      const zoom = getBodyCssZoom();
      const widthAfterResize = startWidth + (zoom === 1 ? displacementX : displacementX / zoom);
      const limitWidth = ${clampCall};
      onUnstableColumnResize(widthAfterResize, limitWidth, column, getCellActualWidth);
      doUpdateResizableWidth(column, limitWidth);
    }`
}

/**
 * DataTable 列宽：zoom=1 与 naive-ui 原生一致；zoom≠1 时 offsetWidth + 位移/zoom。
 */
export function applyNaiveTableHeaderBodyZoomPatch(code: string): string | null {
  if (code.includes(HEADER_MARK))
    return code

  if (!/\bfunction handleColumnResizeStart\s*\(/.test(code))
    return null

  if (!/const widthAfterResize\s*=\s*startWidth\s*\+\s*displacementX/.test(code)) {
    console.warn('[body-zoom] naive-ui DataTable Header 结构变化，未能注入列宽 zoom 修正')
    return null
  }

  let next = `${HEADER_MARK}\n${GET_BODY_CSS_ZOOM}\n${code}`
  const useCjsClamp = next.includes('utils_1.clampValueFollowCSSRules')

  const replacedFns = next.replace(
    /function handleColumnResizeStart\s*\(\s*column\s*(?:,\s*\w+\s*)?\)\s*\{[\s\S]*?\}\s*function handleColumnResize\s*\(\s*column\s*,\s*\w+\s*\)\s*\{[\s\S]*?doUpdateResizableWidth\s*\(\s*column\s*,\s*limitWidth\s*\);\s*\}/,
    buildHeaderResizeFns(useCjsClamp),
  )

  if (replacedFns === next) {
    console.warn('[body-zoom] naive-ui DataTable Header 注入失败：未能改写 resize 函数')
    return null
  }
  next = replacedFns

  if (!next.includes('zoom === 1 ? displacementX : displacementX / zoom')) {
    console.warn('[body-zoom] naive-ui DataTable Header 注入失败：补丁不完整')
    return null
  }

  return next
}

function patchBodyZoomFile(path: string, raw: string): string {
  if (isVueucBinderUtils(path))
    return applyVueucBodyZoomPatch(raw) ?? raw
  if (isNaiveModalComposables(path))
    return applyNaiveModalBodyZoomPatch(raw) ?? raw
  if (isNaiveTableHeader(path))
    return applyNaiveTableHeaderBodyZoomPatch(raw) ?? raw
  return raw
}

const BODY_ZOOM_ID_RE
  = /[\\/](?:vueuc[\\/].*[\\/]binder[\\/]src[\\/]utils\.js|naive-ui[\\/].*[\\/]modal[\\/]src[\\/]composables\.m?js|naive-ui[\\/].*[\\/]data-table[\\/]src[\\/]TableParts[\\/]Header\.m?js)(?:\?|$)/

export function vueucBodyZoomPlugin(): Plugin {
  return {
    name: 'body-zoom-compat',
    enforce: 'pre',
    config() {
      return {
        optimizeDeps: {
          exclude: ['naive-ui', 'vueuc'],
        },
      }
    },
    transform(code, id) {
      if (!BODY_ZOOM_ID_RE.test(id))
        return null
      const patched = patchBodyZoomFile(id, code)
      if (!patched || patched === code)
        return null
      return { code: patched, map: null }
    },
  }
}

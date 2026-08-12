import type { Ref, ShallowRef } from 'vue'
import type { EChartsInitOpts, SetOptionOpts } from 'echarts/core'
import type { ECOption, EChartsType } from './echarts'

export type ChartThemeName = string | object | null | undefined

export type ChartEventHandlers = Record<string, (params: unknown) => void>

export interface UseEchartsOptions {
  /** 初始 / 响应式 option */
  option?: Ref<ECOption | undefined | null> | ECOption
  /** 主题名或主题对象；不传则跟随应用暗色模式（'dark' / undefined） */
  theme?: Ref<ChartThemeName> | ChartThemeName
  /** 渲染器，默认 canvas */
  renderer?: 'canvas' | 'svg'
  /** 是否自动监听容器尺寸并 resize，默认 true */
  autoresize?: boolean
  /** resize 防抖间隔（ms），默认 100 */
  resizeDelay?: number
  /** 是否跟随应用暗色主题切换，默认 true（使用 setTheme，不重建实例） */
  followDarkTheme?: boolean
  /**
   * 是否随 Vue 生命周期自动销毁 / 重建，默认 true。
   * - onScopeDispose：销毁
   * - keep-alive onDeactivated：销毁（disposeOnDeactivated 为 true 时）
   * - keep-alive onActivated：重新初始化
   */
  autoDispose?: boolean
  /** keep-alive 停用时是否销毁实例，默认 true（需 autoDispose 为 true） */
  disposeOnDeactivated?: boolean
  /**
   * 是否深度监听 option，默认 true（外侧多为 computed）。
   * 大数据高频刷新可设为 false，并整体替换 option。
   */
  watchDeep?: boolean
  /** 进入视口后再初始化，默认 true */
  lazy?: boolean
  /** echarts 事件，如 { click, legendselectchanged } */
  on?: ChartEventHandlers
  /** setOption 默认参数 */
  setOptionOpts?: SetOptionOpts
  /** echarts.init 额外参数 */
  initOpts?: Omit<EChartsInitOpts, 'renderer'>
  /** 初始化完成后回调 */
  onReady?: (instance: EChartsType) => void
}

export interface ChartDataURLOptions {
  type?: 'png' | 'jpeg' | 'svg'
  pixelRatio?: number
  backgroundColor?: string
  excludeComponents?: string[]
}

export interface UseEchartsReturn {
  /** 图表实例（shallowRef） */
  chart: ShallowRef<EChartsType | undefined>
  /** 写入 / 更新 option */
  setOption: (option: ECOption, opts?: SetOptionOpts) => void
  /** 手动 resize */
  resize: () => void
  /** 清空画布 */
  clear: () => void
  /** 销毁实例 */
  dispose: () => void
  /** 显示 loading */
  showLoading: (config?: object) => void
  /** 隐藏 loading */
  hideLoading: () => void
  /** 获取实例（可能为 undefined） */
  getInstance: () => EChartsType | undefined
  /** 导出图片 DataURL */
  getDataURL: (opts?: ChartDataURLOptions) => string | undefined
}

export interface EChartExpose {
  setOption: (option: ECOption, opts?: SetOptionOpts) => void
  resize: () => void
  clear: () => void
  dispose: () => void
  showLoading: (config?: object) => void
  hideLoading: () => void
  getInstance: () => EChartsType | undefined
  getDataURL: (opts?: ChartDataURLOptions) => string | undefined
}

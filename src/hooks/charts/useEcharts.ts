import {
  getCurrentInstance,
  isRef,
  onActivated,
  onDeactivated,
  onScopeDispose,
  shallowRef,
  unref,
  watch,
} from 'vue'
import type { Ref } from 'vue'
import type { SetOptionOpts } from 'echarts/core'
import { useDebounceFn } from '@/hooks/useDebounceFn'
import { echarts } from './echarts'
import type { ECOption, EChartsType } from './echarts'
import type {
  ChartDataURLOptions,
  ChartEventHandlers,
  UseEchartsOptions,
  UseEchartsReturn,
} from './types'
import { CHART_DARK_THEME } from './useChartTheme'

const LIGHT_THEME = 'default'

function getExplicitTheme(theme: UseEchartsOptions['theme']) {
  if (theme === undefined)
    return undefined
  const t = unref(theme as Ref<unknown>)
  if (t === null || t === undefined || t === '')
    return undefined
  return t as string | object
}

function resolveThemeName(
  theme: UseEchartsOptions['theme'],
  followDarkTheme: boolean,
  isDark: boolean,
): string | object | undefined {
  const explicit = getExplicitTheme(theme)
  if (explicit !== undefined)
    return explicit
  if (followDarkTheme && isDark)
    return CHART_DARK_THEME
  return undefined
}

function applyTheme(instance: EChartsType, theme: string | object | undefined) {
  // echarts 6：动态切主题，避免 dispose + init
  instance.setTheme((theme ?? LIGHT_THEME) as string | object)
}

function bindEvents(instance: EChartsType, handlers?: ChartEventHandlers) {
  if (!handlers)
    return
  for (const [event, handler] of Object.entries(handlers)) {
    if (handler)
      instance.on(event, handler)
  }
}

function unbindEvents(instance: EChartsType, handlers?: ChartEventHandlers) {
  if (!handlers)
    return
  for (const [event, handler] of Object.entries(handlers)) {
    if (handler)
      instance.off(event, handler)
  }
}

/**
 * ECharts 通用 Hook：初始化、更新、自适应、主题切换、懒加载、生命周期销毁。
 */
export function useEcharts(
  elRef: Ref<HTMLElement | null | undefined>,
  options: UseEchartsOptions = {},
): UseEchartsReturn {
  const {
    option,
    theme,
    renderer = 'canvas',
    autoresize = true,
    resizeDelay = 100,
    followDarkTheme = true,
    autoDispose = true,
    disposeOnDeactivated = true,
    watchDeep = true,
    lazy = true,
    on: eventHandlers,
    setOptionOpts,
    initOpts,
    onReady,
  } = options

  const chart = shallowRef<EChartsType>()
  const designStore = useDesignSettingStore()
  const vm = getCurrentInstance()

  let resizeObserver: ResizeObserver | undefined
  let intersectionObserver: IntersectionObserver | undefined
  let disposed = false
  let visible = !lazy

  function getInstance() {
    return chart.value
  }

  function setOption(next: ECOption, opts?: SetOptionOpts) {
    const chartInstance = chart.value
    if (!chartInstance || disposed)
      return
    chartInstance.setOption(next, {
      lazyUpdate: true,
      ...setOptionOpts,
      ...opts,
    })
  }

  function resize() {
    const chartInstance = chart.value
    if (!chartInstance || chartInstance.isDisposed())
      return
    chartInstance.resize({ animation: { duration: 200 } })
  }

  const debouncedResize = useDebounceFn(resize, resizeDelay)

  function clear() {
    chart.value?.clear()
  }

  function showLoading(config?: object) {
    chart.value?.showLoading('default', config)
  }

  function hideLoading() {
    chart.value?.hideLoading()
  }

  function getDataURL(opts?: ChartDataURLOptions) {
    const chartInstance = chart.value
    if (!chartInstance || chartInstance.isDisposed())
      return undefined
    return chartInstance.getDataURL(opts)
  }

  function unbindAutoresize() {
    resizeObserver?.disconnect()
    resizeObserver = undefined
    window.removeEventListener('resize', debouncedResize)
  }

  function bindAutoresize(el: HTMLElement) {
    if (!autoresize)
      return
    unbindAutoresize()
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => debouncedResize())
      resizeObserver.observe(el)
      return
    }
    window.addEventListener('resize', debouncedResize)
  }

  function unbindLazy() {
    intersectionObserver?.disconnect()
    intersectionObserver = undefined
  }

  function dispose() {
    disposed = true
    unbindAutoresize()
    unbindLazy()
    const chartInstance = chart.value
    if (chartInstance && !chartInstance.isDisposed()) {
      unbindEvents(chartInstance, eventHandlers)
      chartInstance.dispose()
    }
    chart.value = undefined
  }

  function init() {
    const el = elRef.value
    if (!el || disposed)
      return
    if (lazy && !visible)
      return

    if (chart.value && !chart.value.isDisposed()) {
      unbindEvents(chart.value, eventHandlers)
      chart.value.dispose()
      chart.value = undefined
    }

    const themeValue = resolveThemeName(theme, followDarkTheme, designStore.darkTheme)
    const chartInstance = echarts.init(el, themeValue, {
      renderer,
      ...initOpts,
    })
    chart.value = chartInstance

    const initial = option ? unref(option as Ref<ECOption | null | undefined>) : undefined
    if (initial) {
      chartInstance.setOption(initial, {
        lazyUpdate: true,
        ...setOptionOpts,
      })
    }

    bindEvents(chartInstance, eventHandlers)
    bindAutoresize(el)
    onReady?.(chartInstance)
  }

  function reinit() {
    unbindAutoresize()
    disposed = false
    init()
  }

  function switchTheme() {
    const chartInstance = chart.value
    if (!chartInstance || chartInstance.isDisposed()) {
      reinit()
      return
    }
    applyTheme(chartInstance, resolveThemeName(theme, followDarkTheme, designStore.darkTheme))
  }

  function setupLazy(el: HTMLElement) {
    unbindLazy()
    if (!lazy) {
      visible = true
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      visible = true
      return
    }
    visible = false
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
          visible = true
          unbindLazy()
          if (!disposed)
            init()
        }
      },
      { threshold: 0.01 },
    )
    intersectionObserver.observe(el)
  }

  if (autoDispose) {
    onScopeDispose(() => {
      dispose()
    })

    if (vm) {
      if (disposeOnDeactivated) {
        onDeactivated(() => {
          dispose()
        })
      }
      onActivated(() => {
        if (!chart.value || chart.value.isDisposed()) {
          disposed = false
          const el = elRef.value
          if (el && lazy)
            setupLazy(el)
          else
            init()
        }
      })
    }
  }

  if (option && isRef(option)) {
    watch(
      option,
      (val) => {
        if (!chart.value || chart.value.isDisposed())
          return
        if (!val) {
          clear()
          return
        }
        setOption(val)
      },
      { deep: watchDeep },
    )
  }

  if (theme !== undefined && isRef(theme)) {
    watch(theme, () => switchTheme())
  }

  if (followDarkTheme) {
    watch(
      () => designStore.darkTheme,
      () => {
        if (getExplicitTheme(theme) !== undefined)
          return
        switchTheme()
      },
    )
  }

  watch(
    elRef,
    (el) => {
      if (!el) {
        dispose()
        return
      }
      disposed = false
      if (lazy) {
        setupLazy(el)
        return
      }
      visible = true
      init()
    },
    { flush: 'post', immediate: true },
  )

  return {
    chart,
    setOption,
    resize,
    clear,
    dispose,
    showLoading,
    hideLoading,
    getInstance,
    getDataURL,
  }
}

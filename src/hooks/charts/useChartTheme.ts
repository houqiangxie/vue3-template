import { computed } from 'vue'
import type { ECOption } from './echarts'

/** 暗色主题名（与 ECharts 内置 dark 一致） */
export const CHART_DARK_THEME = 'dark'

/**
 * 跟随应用暗色模式的图表主题。
 * 返回值可直接传给 useEcharts / EChart 的 theme。
 */
export function useChartTheme() {
  const designStore = useDesignSettingStore()

  const chartTheme = computed(() => (designStore.darkTheme ? CHART_DARK_THEME : undefined))

  /** 用主题色补齐常用配色，可 merge 进业务 option */
  const themeColorOption = computed<ECOption>(() => ({
    color: [
      designStore.appTheme,
      '#36cfc9',
      '#73d13d',
      '#ffc53d',
      '#ff7a45',
      '#9254de',
      '#40a9ff',
      '#f759ab',
    ],
  }))

  return {
    chartTheme,
    themeColorOption,
    isDark: computed(() => designStore.darkTheme),
    appTheme: computed(() => designStore.appTheme),
  }
}

/** 合并业务 option 与主题色（浅合并顶层） */
export function mergeChartOption(base: ECOption, extra?: ECOption | null): ECOption {
  if (!extra)
    return base
  return {
    ...base,
    ...extra,
    color: extra.color ?? base.color,
  }
}

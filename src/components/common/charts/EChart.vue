<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { SetOptionOpts } from 'echarts/core'
import { NEmpty } from 'naive-ui'
import { useEcharts } from '@/hooks/charts/useEcharts'
import { useChartTheme } from '@/hooks/charts/useChartTheme'
import { isChartOptionEmpty } from '@/hooks/charts/isChartOptionEmpty'
import type { ECOption, EChartsType } from '@/hooks/charts/echarts'
import type {
  ChartEventHandlers,
  ChartThemeName,
  EChartExpose,
} from '@/hooks/charts/types'

const props = withDefaults(defineProps<{
  /** 图表配置 */
  option?: ECOption
  /** 主题；不传则跟随应用暗色模式 */
  theme?: ChartThemeName
  /** 是否显示 loading */
  loading?: boolean
  loadingOptions?: object
  /** 渲染器 */
  renderer?: 'canvas' | 'svg'
  /** 是否自动 resize，默认 true */
  autoresize?: boolean
  /** 是否把应用主题色注入 color，默认 true */
  useAppThemeColor?: boolean
  width?: string | number
  height?: string | number
  /** setOption 参数 */
  setOptionOpts?: SetOptionOpts
  /**
   * 是否空数据。
   * 不传则根据 option.series / dataset 自动判断；传 boolean 可强制覆盖。
   */
  empty?: boolean
  /** 空数据文案，默认「暂无数据」 */
  emptyText?: string
  /** 是否展示空状态，默认 true */
  showEmpty?: boolean
  /**
   * 是否随生命周期自动销毁，默认 true。
   * 卸载 / keep-alive 停用时销毁，激活时重建。
   */
  autoDispose?: boolean
  /** keep-alive 停用时是否销毁，默认 true */
  disposeOnDeactivated?: boolean
  /** 深度监听 option，默认 true；大数据高频刷新可关 */
  watchDeep?: boolean
  /** 进入视口后再初始化，默认 true */
  lazy?: boolean
  /** echarts 事件映射 */
  onEvents?: ChartEventHandlers
}>(), {
  loading: false,
  renderer: 'canvas',
  autoresize: true,
  useAppThemeColor: true,
  width: '100%',
  height: '360px',
  emptyText: '暂无数据',
  showEmpty: true,
  autoDispose: true,
  disposeOnDeactivated: true,
  watchDeep: true,
  lazy: true,
})

const emit = defineEmits<{
  ready: [instance: EChartsType]
  click: [params: unknown]
}>()

const elRef = ref<HTMLElement>()
const themeRef = computed(() => props.theme)
const { themeColorOption } = useChartTheme()

const mergedOption = computed<ECOption | undefined>(() => {
  if (!props.option)
    return undefined
  if (!props.useAppThemeColor)
    return props.option
  return {
    ...themeColorOption.value,
    ...props.option,
    color: props.option.color ?? themeColorOption.value.color,
  }
})

const isEmpty = computed(() => {
  if (!props.showEmpty)
    return false
  if (props.empty !== undefined)
    return props.empty
  return isChartOptionEmpty(props.option)
})

/** 有数据时才挂载图表容器，空状态时销毁实例 */
const chartOption = computed(() => (isEmpty.value ? undefined : mergedOption.value))

const {
  setOption,
  resize,
  clear,
  dispose,
  showLoading,
  hideLoading,
  getInstance,
  getDataURL,
} = useEcharts(elRef, {
  option: chartOption,
  theme: themeRef,
  renderer: props.renderer,
  autoresize: props.autoresize,
  followDarkTheme: true,
  autoDispose: props.autoDispose,
  disposeOnDeactivated: props.disposeOnDeactivated,
  watchDeep: props.watchDeep,
  lazy: props.lazy,
  on: {
    ...props.onEvents,
    click: (params) => {
      props.onEvents?.click?.(params)
      emit('click', params)
    },
  },
  setOptionOpts: props.setOptionOpts,
  onReady: (instance) => {
    if (props.loading)
      instance.showLoading('default', props.loadingOptions)
    emit('ready', instance)
  },
})

watch(
  () => props.loading,
  (v) => {
    if (v)
      showLoading(props.loadingOptions)
    else
      hideLoading()
  },
)

const wrapStyle = computed<CSSProperties>(() => {
  const toSize = (v: string | number) => (typeof v === 'number' ? `${v}px` : v)
  return {
    width: toSize(props.width),
    height: toSize(props.height),
  }
})

defineExpose<EChartExpose>({
  setOption,
  resize,
  clear,
  dispose,
  showLoading,
  hideLoading,
  getInstance,
  getDataURL,
})
</script>

<template>
  <div class="echart-wrap" :style="wrapStyle">
    <div
      v-if="!isEmpty || loading"
      ref="elRef"
      class="echart"
    />
    <div
      v-else
      class="echart-empty"
    >
      <NEmpty :description="emptyText" />
    </div>
  </div>
</template>

<style scoped>
.echart-wrap {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.echart {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.echart-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

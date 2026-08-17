/**
 * ECharts 按需注册（精简核心）。
 * 默认：柱 / 线 / 饼 + Canvas。其它类型在业务侧追加：
 * ```ts
 * import { echarts } from '@/hooks/charts/echarts'
 * import { ScatterChart, RadarChart, GaugeChart, FunnelChart } from 'echarts/charts'
 * import { VisualMapComponent, RadarComponent, GraphicComponent } from 'echarts/components'
 * import { SVGRenderer } from 'echarts/renderers'
 * echarts.use([ScatterChart, RadarChart, GaugeChart, FunnelChart, VisualMapComponent, RadarComponent, GraphicComponent, SVGRenderer])
 * ```
 */
import * as echarts from 'echarts/core'
import {
  BarChart,
  LineChart,
  PieChart,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
} from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import type {
  BarSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
} from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  DatasetComponentOption,
  LegendComponentOption,
  ToolboxComponentOption,
  DataZoomComponentOption,
  MarkLineComponentOption,
  MarkPointComponentOption,
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
  LabelLayout,
  CanvasRenderer,
])

export type ECOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DatasetComponentOption
  | LegendComponentOption
  | ToolboxComponentOption
  | DataZoomComponentOption
  | MarkLineComponentOption
  | MarkPointComponentOption
>

export type { EChartsType } from 'echarts/core'
export { echarts }

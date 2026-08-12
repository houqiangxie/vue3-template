import type { ECOption } from './echarts'

function isNonEmptyArray(data: unknown): boolean {
  return Array.isArray(data) && data.length > 0
}

/** 树图节点是否仍有有效内容 */
function hasTreeNodeData(nodes: unknown): boolean {
  if (!isNonEmptyArray(nodes))
    return false
  return (nodes as unknown[]).some((node) => {
    if (node == null)
      return false
    if (typeof node !== 'object')
      return true
    const item = node as { value?: unknown, children?: unknown }
    if (item.value != null && item.value !== '')
      return true
    return hasTreeNodeData(item.children)
  })
}

function hasSeriesItemData(item: Record<string, unknown>): boolean {
  if (isNonEmptyArray(item.data)) {
    // treemap / sunburst：仅有空 children 的根节点视为空
    if (item.type === 'treemap' || item.type === 'sunburst')
      return hasTreeNodeData(item.data)
    return true
  }
  if (typeof item.data === 'object' && item.data != null)
    return true
  // graph / sankey / lines
  if (isNonEmptyArray(item.links) || isNonEmptyArray(item.edges))
    return true
  if (isNonEmptyArray(item.categories))
    return true
  return false
}

function hasDatasetSource(option: ECOption): boolean {
  const dataset = option.dataset as unknown
  if (dataset == null)
    return false
  const list = Array.isArray(dataset) ? dataset : [dataset]
  return list.some((entry) => {
    if (!entry || typeof entry !== 'object')
      return false
    const source = (entry as { source?: unknown }).source
    if (source == null)
      return false
    if (Array.isArray(source)) {
      // 仅表头一行（如 [['类目','值']]）视为无数据
      if (source.length === 0)
        return false
      if (source.length === 1 && Array.isArray(source[0]) && (source[0] as unknown[]).every(v => typeof v === 'string'))
        return false
      return true
    }
    if (typeof source === 'object') {
      const values = Object.values(source as Record<string, unknown>)
      return values.some(v => isNonEmptyArray(v))
    }
    return false
  })
}

/**
 * 判断 option 是否无有效业务数据
 */
export function isChartOptionEmpty(option?: ECOption | null): boolean {
  if (!option)
    return true

  // timeline / media：检查子 option
  const media = (option as { media?: Array<{ option?: ECOption }> }).media
  if (Array.isArray(media) && media.some(m => m?.option && !isChartOptionEmpty(m.option)))
    return false

  const options = (option as { options?: ECOption[] }).options
  if (Array.isArray(options) && options.some(o => !isChartOptionEmpty(o)))
    return false

  const baseOption = (option as { baseOption?: ECOption }).baseOption
  if (baseOption && !isChartOptionEmpty(baseOption))
    return false

  const series = option.series as unknown
  const seriesList = series == null
    ? []
    : Array.isArray(series)
      ? series
      : [series]

  const hasSeriesData = seriesList.some((item) => {
    if (!item || typeof item !== 'object')
      return false
    return hasSeriesItemData(item as Record<string, unknown>)
  })

  if (hasSeriesData)
    return false

  if (hasDatasetSource(option))
    return false

  return true
}

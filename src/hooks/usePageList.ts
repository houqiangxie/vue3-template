import type { Ref } from 'vue'
import type { TableFilterState, TableSortState } from '@/components/common/table/types'

export interface PageListResult<T = Record<string, unknown>> {
  rows: T[]
  total: number
}

export interface UsePageListOptions<T = Record<string, unknown>> {
  /** 列表请求 */
  fetcher: (query: Record<string, unknown>) => Promise<PageListResult<T>>
  /** 搜索初始值（不含分页） */
  defaults?: Record<string, unknown>
  /** 请求前转换 query（如拆分 dateRange） */
  buildQuery?: (model: Record<string, unknown>) => Record<string, unknown>
  /** 挂载后立即请求，默认 true */
  immediate?: boolean
  pageSize?: number
  /** 每次成功拉取后的回调（如清空勾选） */
  onFetched?: () => void
  /**
   * 远程排序写入 searchModel 的字段名（若依风格默认）
   * - columnKey → orderByColumn
   * - ascend/descend → isAsc: 'asc' | 'desc'
   */
  sortKeys?: {
    column?: string
    order?: string
  }
}

export type PageSearchModel = Record<string, unknown> & {
  pageNum: number
  pageSize: number
}

/**
 * 将分页接口响应（rows/total）转为 usePageList 所需结构
 * @example fetcher: async (q) => toPageResult(await listConfig(q))
 */
export function toPageResult(
  res: { data?: { rows?: unknown[]; total?: number } | null },
): PageListResult {
  return {
    rows: (res.data?.rows ?? []) as Record<string, unknown>[],
    total: res.data?.total ?? 0,
  }
}

/**
 * 标准分页列表：searchModel / fetchList / 分页切换
 * System CRUD 页优先使用，避免每页复制一套样板代码
 */
export function usePageList<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UsePageListOptions<T>,
) {
  const {
    fetcher,
    defaults = {},
    buildQuery,
    immediate = true,
    pageSize = 10,
    onFetched,
    sortKeys = { column: 'orderByColumn', order: 'isAsc' },
  } = options

  const columnKeyName = sortKeys.column ?? 'orderByColumn'
  const orderKeyName = sortKeys.order ?? 'isAsc'

  const searchModel = ref({
    pageNum: 1,
    pageSize,
    ...defaults,
  }) as Ref<PageSearchModel>

  const tableData = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  /** immediate 时初始即为 loading，避免首屏空状态闪烁 */
  const loading = ref(immediate)

  function resolveQuery() {
    const model = { ...searchModel.value }
    return buildQuery ? buildQuery(model) : model
  }

  async function fetchList() {
    loading.value = true
    try {
      const { rows, total: count } = await fetcher(resolveQuery())
      tableData.value = rows
      total.value = count
      onFetched?.()
    }
    finally {
      loading.value = false
    }
  }

  function handleSearch(payload?: Record<string, unknown>) {
    if (payload) {
      Object.assign(searchModel.value, payload)
    }
    searchModel.value.pageNum = 1
    return fetchList()
  }

  function handleReset(resetDefaults?: Record<string, unknown>) {
    searchModel.value = {
      pageNum: 1,
      pageSize: searchModel.value.pageSize,
      ...defaults,
      ...resetDefaults,
    }
    return fetchList()
  }

  function onPageChange(page: number) {
    searchModel.value.pageNum = page
    return fetchList()
  }

  function onPageSizeChange(size: number) {
    searchModel.value.pageSize = size
    searchModel.value.pageNum = 1
    return fetchList()
  }

  /** 远程排序：写入 orderByColumn / isAsc 后重新请求 */
  function onSorterChange(sorter: TableSortState | TableSortState[] | null) {
    const state = Array.isArray(sorter) ? sorter[0] : sorter
    if (!state || !state.order) {
      delete searchModel.value[columnKeyName]
      delete searchModel.value[orderKeyName]
    }
    else {
      searchModel.value[columnKeyName] = state.columnKey
      searchModel.value[orderKeyName] = state.order === 'ascend' ? 'asc' : 'desc'
    }
    searchModel.value.pageNum = 1
    return fetchList()
  }

  /**
   * 远程筛选：按列 key 写入 searchModel（多选数组 / 单选标量；清空则 delete）
   * 需后端支持对应查询参数
   */
  function onFiltersChange(filters: TableFilterState) {
    for (const [key, value] of Object.entries(filters)) {
      if (value == null || (Array.isArray(value) && value.length === 0))
        delete searchModel.value[key]
      else
        searchModel.value[key] = value
    }
    searchModel.value.pageNum = 1
    return fetchList()
  }

  if (immediate) {
    onMounted(() => {
      void fetchList()
    })
  }

  return {
    searchModel,
    tableData,
    total,
    loading,
    fetchList,
    handleSearch,
    handleReset,
    onPageChange,
    onPageSizeChange,
    onSorterChange,
    onFiltersChange,
  }
}

/** 常见：搜索里的 dateRange → beginTime / endTime */
export function splitDateRange(
  model: Record<string, unknown>,
  rangeKey = 'dateRange',
  beginKey = 'beginTime',
  endKey = 'endTime',
): Record<string, unknown> {
  const { [rangeKey]: dateRange, ...rest } = model
  const query: Record<string, unknown> = { ...rest }
  if (Array.isArray(dateRange) && dateRange.length === 2) {
    query[beginKey] = dateRange[0]
    query[endKey] = dateRange[1]
  }
  return query
}

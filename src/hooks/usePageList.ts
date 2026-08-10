import type { Ref } from 'vue'

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
}

export type PageSearchModel = Record<string, unknown> & {
  pageNum: number
  pageSize: number
}

/**
 * 将若依分页接口响应转为 usePageList 所需结构
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
  } = options

  const searchModel = ref({
    pageNum: 1,
    pageSize,
    ...defaults,
  }) as Ref<PageSearchModel>

  const tableData = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)

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

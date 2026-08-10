import type { Ref } from 'vue'

export interface UseTreeListOptions<T = Record<string, unknown>> {
  /** 拉取完整树 */
  fetcher: () => Promise<T[]>
  /** 客户端过滤（按 searchModel） */
  filter?: (data: T[], model: Record<string, unknown>) => T[]
  /** 搜索初始值 */
  defaults?: Record<string, unknown>
  /** 挂载后立即请求，默认 true */
  immediate?: boolean
}

/**
 * 树表列表（无分页）：Dept / Menu 等客户端过滤场景
 */
export function useTreeList<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseTreeListOptions<T>,
) {
  const {
    fetcher,
    filter,
    defaults = {},
    immediate = true,
  } = options

  const searchModel = ref({ ...defaults }) as Ref<Record<string, unknown>>
  const tableData = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)

  async function fetchList() {
    loading.value = true
    try {
      const data = await fetcher()
      tableData.value = filter ? filter(data, searchModel.value) : data
    }
    finally {
      loading.value = false
    }
  }

  function handleSearch(payload?: Record<string, unknown>) {
    if (payload)
      Object.assign(searchModel.value, payload)
    return fetchList()
  }

  function handleReset(resetDefaults?: Record<string, unknown>) {
    searchModel.value = { ...defaults, ...resetDefaults }
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
    loading,
    fetchList,
    handleSearch,
    handleReset,
  }
}

/** 按谓词过滤树（保留命中节点的祖先链） */
export function filterTreeBy<T extends Record<string, unknown>>(
  nodes: T[],
  match: (node: T) => boolean,
  childrenKey = 'children',
): T[] {
  return nodes.reduce<T[]>((acc, node) => {
    const children = Array.isArray(node[childrenKey])
      ? filterTreeBy(node[childrenKey] as T[], match, childrenKey)
      : []
    if (match(node) || children.length) {
      acc.push({
        ...node,
        [childrenKey]: children.length ? children : undefined,
      })
    }
    return acc
  }, [])
}

/** 按名称字段过滤树（保留命中节点的祖先链） */
export function filterTreeByKeyword<T extends Record<string, unknown>>(
  nodes: T[],
  keyword: string,
  nameKey: string,
  childrenKey = 'children',
): T[] {
  if (!keyword)
    return nodes
  return filterTreeBy(
    nodes,
    node => String(node[nameKey] ?? '').includes(keyword),
    childrenKey,
  )
}

/** 按状态字段过滤树（保留命中节点的祖先链） */
export function filterTreeByStatus<T extends Record<string, unknown>>(
  nodes: T[],
  status: string,
  statusKey = 'status',
  childrenKey = 'children',
): T[] {
  if (status == null || status === '')
    return nodes
  return filterTreeBy(
    nodes,
    node => String(node[statusKey]) === status,
    childrenKey,
  )
}

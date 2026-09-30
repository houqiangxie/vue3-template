import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

/** 开启/关闭，同源 utils/dict COMMON_STATUS */
export const bpmStatusOptions = getIntDictOptions(DICT_TYPE.COMMON_STATUS).map(d => ({
  label: d.label,
  value: Number(d.value),
}))

export const processListenerTypeOptions = [
  { label: '执行监听器', value: 'execution' },
  { label: '任务监听器', value: 'task' },
]

export const processListenerValueTypeOptions = [
  { label: 'Java 类', value: 'class' },
  { label: '表达式', value: 'expression' },
  { label: '代理表达式', value: 'delegateExpression' },
]

export const processListenerEventOptions = [
  { label: 'start', value: 'start' },
  { label: 'end', value: 'end' },
  { label: 'create', value: 'create' },
  { label: 'assignment', value: 'assignment' },
  { label: 'complete', value: 'complete' },
  { label: 'delete', value: 'delete' },
]

/** 请假类型，同源 utils/dict BPM_OA_LEAVE_TYPE */
export const leaveTypeOptions = getIntDictOptions(DICT_TYPE.BPM_OA_LEAVE_TYPE).map(d => ({
  label: d.label,
  value: Number(d.value),
}))

function normalizeBpmDateRange(range: unknown): string[] | undefined {
  if (!Array.isArray(range) || range.length < 2 || range[0] == null || range[1] == null)
    return undefined
  const start = String(range[0])
  const end = String(range[1])
  return [
    start.includes(' ') ? start : `${start} 00:00:00`,
    end.includes(' ') ? end : `${end} 23:59:59`,
  ]
}

/** 将芋道分页 { list, total } 转为 usePageList 结构，并映射 pageNum → pageNo */
export function buildBpmPageQuery(model: Record<string, unknown>) {
  const { pageNum, pageSize, dateRange, createTime, ...rest } = model
  const query: Record<string, unknown> = {
    ...rest,
    pageNo: pageNum,
    pageSize,
  }
  // 芋道风格：createTime 传 [开始, 结束]；也兼容本仓库 dateRange
  const range = normalizeBpmDateRange(createTime ?? dateRange)
  if (range)
    query.createTime = range
  return query
}

/**
 * 兼容多种分页形态：
 * - 芋道解包后：{ list, total }
 * - 若依/本仓库：{ rows, total }
 * - 未解包：{ data: { list|rows, total } }
 */
export function toBpmPageResult(data: unknown) {
  const raw = data as Record<string, unknown> | null | undefined
  const page = (
    raw
    && (Array.isArray(raw.list) || Array.isArray(raw.rows) || typeof raw.total === 'number')
  )
    ? raw
    : ((raw?.data as Record<string, unknown> | undefined) ?? {})
  const list = page.list ?? page.rows
  return {
    rows: (Array.isArray(list) ? list : []) as Record<string, unknown>[],
    total: Number(page.total ?? 0) || 0,
  }
}

/** 从 create 接口返回值解析数字 ID */
export function extractBpmId(raw: unknown): number | undefined {
  if (raw == null)
    return undefined
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0)
    return raw
  if (typeof raw === 'string' && raw.trim() && Number.isFinite(Number(raw))) {
    const n = Number(raw)
    return n > 0 ? n : undefined
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return extractBpmId(obj.id ?? obj.data)
  }
  return undefined
}

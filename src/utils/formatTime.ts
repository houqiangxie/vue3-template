import dayjs from 'dayjs'

export function formatDate(date: Date | string | number | undefined, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date)
    return ''
  return dayjs(date).format(format)
}

/** 表格列日期格式化（兼容芋道签名） */
export function dateFormatter(_row: unknown, _column: unknown, cellValue: unknown) {
  return formatDate(cellValue as string | number | Date)
}

/**
 * 将毫秒转换成时长字符串。例如：`2 小时 30 分钟`
 * （兼容芋道签名；用于任务耗时 durationInMillis）
 */
export function formatPast2(ms: number | string | undefined | null): string {
  if (ms == null || ms === '')
    return ''
  const value = typeof ms === 'number' ? ms : Number(ms)
  if (!Number.isFinite(value) || value < 0)
    return ''
  const day = Math.floor(value / (24 * 60 * 60 * 1000))
  const hour = Math.floor(value / (60 * 60 * 1000) - day * 24)
  const minute = Math.floor(value / (60 * 1000) - day * 24 * 60 - hour * 60)
  const second = Math.floor(value / 1000 - day * 24 * 60 * 60 - hour * 60 * 60 - minute * 60)
  if (day > 0)
    return `${day} 天${hour} 小时 ${minute} 分钟`
  if (hour > 0)
    return `${hour} 小时 ${minute} 分钟`
  if (minute > 0)
    return `${minute} 分钟`
  if (second > 0)
    return `${second} 秒`
  return '0 秒'
}

/** 有耗时则格式化，否则返回占位符 */
export function formatDurationOrDash(ms?: number | string | null) {
  const value = typeof ms === 'number' ? ms : Number(ms)
  return Number.isFinite(value) && value > 0 ? formatPast2(value) : '-'
}

/*
 * 通用工具：xlsx 按需动态加载，避免非导出页背体积
 */
import { saveAs } from 'file-saver'

/**
 * @param json json 数据 Array<object>
 * @param fields 表头 object
 * @param filename 表名 string
 */
const exportXlsx = async (
  json: Array<Record<string, unknown>>,
  fields: Record<string, string>,
  filename: string = '.xlsx',
) => {
  const { utils, write } = await import('xlsx')
  const s2ab = (s: string) => {
    if (typeof ArrayBuffer !== 'undefined') {
      const buf = new ArrayBuffer(s.length)
      const view = new Uint8Array(buf)
      for (let i = 0; i !== s.length; ++i)
        view[i] = s.charCodeAt(i) & 0xff
      return buf
    }
    const buf = new Array(s.length)
    for (let i = 0; i !== s.length; ++i)
      buf[i] = s.charCodeAt(i) & 0xff
    return buf
  }

  const rows = json.map((item) => {
    const next: Record<string, unknown> = {}
    for (const i in item) {
      if (Object.prototype.hasOwnProperty.call(fields, i))
        next[fields[i]] = item[i]
    }
    return next
  })

  const sheetName = filename
  const wb = utils.book_new()
  const ws = utils.json_to_sheet(rows, { header: Object.values(fields) })
  wb.SheetNames.push(sheetName)
  wb.Sheets[sheetName] = ws
  const wbout = write(wb, {
    bookType: 'xlsx',
    bookSST: false,
    type: 'binary',
    cellStyles: true,
    cellDates: true,
  })
  const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' })
  saveAs(blob, `${filename}.xlsx`)
}

const importXlsx = async (
  event: Event,
  callback: (tb: unknown[]) => void = () => {},
) => {
  const file = (event.target as HTMLInputElement)?.files?.[0]
  if (!file) {
    return
  }
  if (!file.name.match(/(xls|xlsx)$/)) {
    window.$message?.error('文件格式不对，请重新选择文件上传')
    return
  }
  const { utils, read } = await import('xlsx')
  const fileReader = new FileReader()
  fileReader.onload = (ev: ProgressEvent<FileReader>) => {
    try {
      const tableData: unknown[] = []
      const data = ev.target?.result
      const workbook = read(data, { type: 'binary', cellDates: true })
      workbook.SheetNames.forEach((item) => {
        tableData.push(...utils.sheet_to_json(workbook.Sheets[item]))
      })
      callback?.(tableData)
    }
    catch {
      return false
    }
  }
  fileReader.readAsBinaryString(file)
}

export const deepClone = (target: unknown): unknown => {
  if (target && typeof target === 'object') {
    const result: Record<string, unknown> | unknown[] = Array.isArray(target) ? [] : {}
    for (const key in target as Record<string, unknown>) {
      const value = (target as Record<string, unknown>)[key]
      if (typeof value === 'object')
        (result as Record<string, unknown>)[key] = deepClone(value)
      else
        (result as Record<string, unknown>)[key] = value
    }
    return result
  }
  return target
}

export { exportXlsx, importXlsx }

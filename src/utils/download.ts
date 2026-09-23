function download0(data: Blob, fileName: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType })
  const href = URL.createObjectURL(blob)
  const downA = document.createElement('a')
  downA.href = href
  downA.download = fileName
  downA.click()
  URL.revokeObjectURL(href)
}

const download = {
  excel: (data: Blob, fileName: string) => download0(data, fileName, 'application/vnd.ms-excel'),
  word: (data: Blob, fileName: string) => download0(data, fileName, 'application/msword'),
  zip: (data: Blob, fileName: string) => download0(data, fileName, 'application/zip'),
  html: (data: Blob, fileName: string) => download0(data, fileName, 'text/html'),
  markdown: (data: Blob, fileName: string) => download0(data, fileName, 'text/markdown'),
  json: (data: Blob, fileName: string) => download0(data, fileName, 'application/json'),
  xml: (data: string | Blob, fileName: string) => {
    const blob = typeof data === 'string' ? new Blob([data], { type: 'application/xml' }) : data
    download0(blob, fileName, 'application/xml')
  },
}

export default download

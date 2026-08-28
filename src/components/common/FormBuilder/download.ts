const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++)
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    table[i] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let c = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++)
    c = CRC_TABLE[(c ^ data[i]!) & 0xFF]! ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function writeUint32LE(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

function writeUint16LE(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

function encodeUtf8(text: string) {
  return new TextEncoder().encode(text)
}

export function createZipBlob(files: Array<{ name: string, content: string }>): Blob {
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = encodeUtf8(file.name.replace(/\\/g, '/'))
    const data = encodeUtf8(file.content)
    const crc = crc32(data)

    const local = new Uint8Array(30 + nameBytes.length)
    const localView = new DataView(local.buffer)
    writeUint32LE(localView, 0, 0x04034b50)
    writeUint16LE(localView, 4, 20)
    writeUint16LE(localView, 6, 0)
    writeUint16LE(localView, 8, 0)
    writeUint16LE(localView, 10, 0)
    writeUint16LE(localView, 12, 0)
    writeUint32LE(localView, 14, crc)
    writeUint32LE(localView, 18, data.length)
    writeUint32LE(localView, 22, data.length)
    writeUint16LE(localView, 26, nameBytes.length)
    writeUint16LE(localView, 28, 0)
    local.set(nameBytes, 30)
    locals.push(local, data)

    const central = new Uint8Array(46 + nameBytes.length)
    const centralView = new DataView(central.buffer)
    writeUint32LE(centralView, 0, 0x02014b50)
    writeUint16LE(centralView, 4, 20)
    writeUint16LE(centralView, 6, 20)
    writeUint16LE(centralView, 8, 0)
    writeUint16LE(centralView, 10, 0)
    writeUint16LE(centralView, 12, 0)
    writeUint16LE(centralView, 14, 0)
    writeUint32LE(centralView, 16, crc)
    writeUint32LE(centralView, 20, data.length)
    writeUint32LE(centralView, 24, data.length)
    writeUint16LE(centralView, 28, nameBytes.length)
    writeUint16LE(centralView, 30, 0)
    writeUint16LE(centralView, 32, 0)
    writeUint16LE(centralView, 34, 0)
    writeUint16LE(centralView, 36, 0)
    writeUint32LE(centralView, 38, 0)
    writeUint32LE(centralView, 42, offset)
    central.set(nameBytes, 46)
    centrals.push(central)

    offset += local.length + data.length
  }

  const centralDir = concatUint8Arrays(centrals)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  writeUint32LE(endView, 0, 0x06054b50)
  writeUint16LE(endView, 4, 0)
  writeUint16LE(endView, 6, 0)
  writeUint16LE(endView, 8, files.length)
  writeUint16LE(endView, 10, files.length)
  writeUint32LE(endView, 12, centralDir.length)
  writeUint32LE(endView, 16, offset)
  writeUint16LE(endView, 20, 0)

  return new Blob([concatUint8Arrays([...locals, centralDir, end]) as BlobPart], { type: 'application/zip' })
}

export function downloadTextFile(content: string, filename: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadZipFile(files: Array<{ name: string, content: string }>, filename: string) {
  const blob = createZipBlob(files)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

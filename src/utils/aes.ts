/**
 * AES-CBC + PKCS7（Web Crypto），输出密文十六进制大写。
 * 与旧 CryptoJS 实现兼容：Utf8 key/iv + ciphertext hex。
 */
function toHexUpper(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

export async function aesEncryptCbcHex(
  plainText: string,
  keyUtf8: string,
  ivUtf8: string,
): Promise<string> {
  const enc = new TextEncoder()
  const keyBytes = enc.encode(keyUtf8)
  const ivBytes = enc.encode(ivUtf8)

  if (![16, 24, 32].includes(keyBytes.length))
    throw new Error(`AES key must be 16/24/32 bytes, got ${keyBytes.length}`)
  if (ivBytes.length !== 16)
    throw new Error(`AES IV must be 16 bytes, got ${ivBytes.length}`)

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CBC' },
    false,
    ['encrypt'],
  )

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: ivBytes },
    key,
    enc.encode(plainText),
  )

  return toHexUpper(encrypted)
}

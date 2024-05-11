import { nanoid } from 'nanoid'

export async function getFileInfoFromBlob(blob: Blob, maxSize = 1024 * 1024 * 2) {
  const id = nanoid(8)
  const isTooLarge = blob.size > maxSize
  const base64 = isTooLarge ? null : await blobToBase64(blob)
  const sha256 = isTooLarge ? null : await blobToSha256(blob)
  return {
    id,
    // @ts-ignore
    name: blob.name,
    size: blob.size,
    type: blob.type,
    base64,
    sha256,
  }
}

export function stringToArrayBuffer(str: string) {
  return new TextEncoder().encode(str).buffer
}

export async function sha256(data: string | ArrayBuffer | ArrayBufferView) {
  if (typeof data === 'string') {
    data = stringToArrayBuffer(data)
  }
  return crypto.subtle.digest('SHA-256', data).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  )
}

export async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function blobToSha256(blob: Blob) {
  const buffer = await blob.arrayBuffer()
  return sha256(buffer)
}

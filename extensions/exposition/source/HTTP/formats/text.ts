export const type = 'text/plain'
export const multipart = 'multipart/text'

export function decode (buffer: Uint8Array): any {
  return buffer.toString()
}

export function encode (value: { toString: () => string }): Uint8Array {
  return Uint8Array.from(Buffer.from(value.toString()))
}

export const type = 'text/plain'
export const multipart = 'multipart/text'

export function decode (buffer: Buffer, charset = 'utf-8'): any {
  return buffer.toString(charset as BufferEncoding)
}

export function encode (value: { toString: () => string }): Buffer {
  return Buffer.from(value.toString())
}

export const type = 'application/json'
export const multipart = 'multipart/json'

export function decode (buffer: Buffer, charset = 'utf-8'): any {
  const text = buffer.toString(charset as BufferEncoding)

  return JSON.parse(text)
}

export function encode (value: any): Buffer {
  const text = JSON.stringify(value)

  return Buffer.from(text)
}

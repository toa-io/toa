export const type = 'application/json'
export const multipart = 'multipart/json'

export function decode (buffer: Uint8Array): any {
  const text = buffer.toString()

  return JSON.parse(text)
}

export function encode (value: any): Uint8Array {
  const text = JSON.stringify(value)

  return Uint8Array.from(Buffer.from(text))
}

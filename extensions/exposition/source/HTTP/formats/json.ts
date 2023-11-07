import { Buffer } from 'node:buffer'

export const type = 'application/json'
export const multipart = 'multipart/json'

export function decode (buffer: Buffer): any {
  const text = buffer.toString()

  return JSON.parse(text)
}

export function encode (value: any): Buffer {
  const text = JSON.stringify(value)

  return Buffer.from(text)
}

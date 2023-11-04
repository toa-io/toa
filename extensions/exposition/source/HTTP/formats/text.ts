import { Buffer } from 'node:buffer'

export const type = 'text/plain'
export const multipart = 'multipart/text'

export function decode (buffer: Buffer): any {
  return buffer.toString()
}

export function encode (value: any): Buffer {
  return Buffer.from(value.toString())
}

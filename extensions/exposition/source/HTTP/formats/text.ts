import { Buffer } from 'node:buffer'

export function decode (buffer: Buffer): any {
  return buffer.toString()
}

export function encode (value: any): Buffer {
  return Buffer.from(value.toString())
}

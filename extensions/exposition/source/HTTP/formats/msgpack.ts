import { type Buffer } from 'node:buffer'
import { pack, unpack } from 'msgpackr'

export function decode (buffer: Buffer): any {
  return unpack(buffer)
}

export function encode (value: any): Buffer {
  if (typeof value === 'object' && value !== null)
    Object.setPrototypeOf(value, null)

  return pack(value)
}

export const type = 'application/msgpack'
export const multipart = 'multipart/msgpack'

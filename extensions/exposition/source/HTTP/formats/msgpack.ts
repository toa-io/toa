import { pack, unpack } from 'msgpackr'

export function decode (buffer: Uint8Array): any {
  return unpack(buffer)
}

export function encode (value: any): Uint8Array {
  if (typeof value === 'object' && value !== null)
    Object.setPrototypeOf(value, null)

  return Uint8Array.from(pack(value))
}

export const type = 'application/msgpack'
export const multipart = 'multipart/msgpack'

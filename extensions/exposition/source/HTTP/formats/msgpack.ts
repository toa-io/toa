import { type Buffer } from 'node:buffer'
import * as msgpack from 'msgpackr'

export function decode (buffer: Buffer): any {
  return msgpack.decode(buffer)
}

export function encode (value: any): Buffer {
  return msgpack.encode(value)
}
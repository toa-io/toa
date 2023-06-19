import { type Buffer } from 'node:buffer'
import * as json from './json'
import * as yaml from './yaml'
import * as msgpack from './msgpack'

export const formats: Record<string, Format> = {
  'application/json': json,
  'application/yaml': yaml,
  'application/msgpack': msgpack
}

export interface Format {
  encode: (value: any) => Buffer
  decode: (buffer: Buffer) => any
}

import { type Buffer } from 'node:buffer'
import * as json from './json'
import * as yaml from './yaml'
import * as msgpack from './msgpack'

export const formats: Record<string, Format> = {
  'application/yaml': yaml,
  'application/json': json,
  'application/msgpack': msgpack
}

export const types = Object.keys(formats)

export interface Format {
  encode: (value: any) => Buffer
  decode: (buffer: Buffer) => any
}

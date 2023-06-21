import { type Buffer } from 'node:buffer'
import * as json from './json'
import * as yaml from './yaml'
import * as msgpack from './msgpack'
import * as text from './text'

export const formats: Record<string, Format> = {
  'application/yaml': yaml,
  'application/msgpack': msgpack,
  'application/json': json,
  'text/plain': text
}

export const types = Object.keys(formats)

export interface Format {
  encode: (value: any) => Buffer
  decode: (buffer: Buffer) => any
}

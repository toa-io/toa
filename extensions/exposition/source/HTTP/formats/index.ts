import { type Buffer } from 'node:buffer'
import * as json from './json'
import * as yaml from './yaml'
import * as msgpack from './msgpack'
import * as text from './text'

export const formats: Record<string, Format> = {
  [msgpack.type]: msgpack,
  [yaml.type]: yaml,
  [json.type]: json,
  [text.type]: text
}

export const types = Object.keys(formats)

export interface Format {
  readonly type: string
  readonly multipart: string

  encode: (value: any) => Buffer
  decode: (buffer: Buffer) => any
}

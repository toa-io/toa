import { type Buffer } from 'node:buffer'
import * as json from './json'
import * as yaml from './yaml'
import * as msgpack from './msgpack'
import * as text from './text'

export const formats: Record<string, Format> = {
  [json.type]: json,
  [yaml.type]: yaml,
  [text.type]: text,
  [msgpack.type]: msgpack
}

export const types = Object.keys(formats)

export interface Format {
  readonly type: string
  readonly multipart: string

  encode: (value: any) => Buffer
  decode: (buffer: Buffer) => any
}

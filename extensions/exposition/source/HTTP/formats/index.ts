import * as json from './json.js'
import * as yaml from './yaml.js'
import * as msgpack from './msgpack.js'
import * as text from './text.js'

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
  decode: (buffer: Buffer, charset?: string) => any
}

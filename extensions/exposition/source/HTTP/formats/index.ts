import * as json from './json.js'
import * as yaml from './yaml.js'
import * as msgpack from './msgpack.js'
import * as text from './text.js'
import * as form from './form.js'

/** What a reply may be encoded as, and so what `accept` is negotiated against. */
export const formats: Record<string, Format> = {
  [json.type]: json,
  [yaml.type]: yaml,
  [text.type]: text,
  [msgpack.type]: msgpack
}

export const types = Object.keys(formats)

/**
 * What a request body may arrive as. Everything a reply may be, and a form besides — which
 * is read and never written, so it is not something a reply can be asked for.
 */
export const decoders: Record<string, Decoder> = {
  ...formats,
  [form.type]: form
}

export interface Decoder {
  readonly type: string

  decode: (buffer: Buffer, charset?: string) => any
}

export interface Format extends Decoder {
  readonly multipart: string

  encode: (value: any) => Buffer
}

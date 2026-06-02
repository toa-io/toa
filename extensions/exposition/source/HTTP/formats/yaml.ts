import * as yaml from 'js-yaml'

export const type = 'application/yaml'
export const multipart = 'multipart/yaml'

export function decode (buffer: Buffer, charset = 'utf-8'): any {
  const text = buffer.toString(charset as BufferEncoding)

  return yaml.load(text)
}

export function encode (value: any): Buffer {
  const text = yaml.dump(value, { lineWidth: -1, noRefs: true })

  return Buffer.from(text)
}

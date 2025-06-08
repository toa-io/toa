import * as yaml from 'js-yaml'

export const type = 'application/yaml'
export const multipart = 'multipart/yaml'

export function decode (buffer: Uint8Array): any {
  const text = buffer.toString()

  return yaml.load(text)
}

export function encode (value: any): Uint8Array {
  const text = yaml.dump(value, { lineWidth: -1, noRefs: true })

  return Uint8Array.from(Buffer.from(text))
}

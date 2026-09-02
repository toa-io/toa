import * as yaml from 'js-yaml'

export const type = 'application/yaml'
export const multipart = 'multipart/yaml'

export function decode (buffer: Buffer, charset = 'utf-8'): any {
  const text = buffer.toString(charset as BufferEncoding)

  return yaml.load(text)
}

export function encode (value: any): Buffer {
  const serializable = value instanceof Error ? Object.assign({}, value) : represent(value)
  const text = yaml.dump(serializable, { lineWidth: -1, noRefs: true })

  return Buffer.from(text)
}

/** What says how it is to be written — a redacted secret — is written that way, as in JSON. */
function represent (value: unknown): unknown {
  if (typeof value !== 'object' || value === null || value instanceof Date || Buffer.isBuffer(value))
    return value

  if ('toJSON' in value && typeof value.toJSON === 'function')
    return value.toJSON()

  if (Array.isArray(value))
    return value.map(represent)

  const object = value as Record<string, unknown>
  const represented: Record<string, unknown> = {}

  for (const key of Object.keys(object))
    represented[key] = represent(object[key])

  return represented
}

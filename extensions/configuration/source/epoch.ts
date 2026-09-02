import { createHash } from 'node:crypto'

/** The same for the same schema, whatever the key order it was written in. */
export function epoch (schema: object): string {
  return createHash('sha256').update(canonical(schema)).digest('hex')
}

function canonical (value: unknown): string {
  if (Array.isArray(value))
    return '[' + value.map(canonical).join(',') + ']'

  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>
    const keys = Object.keys(object).filter((key) => object[key] !== undefined).sort()
    const entries = keys.map((key) => JSON.stringify(key) + ':' + canonical(object[key]))

    return '{' + entries.join(',') + '}'
  }

  return JSON.stringify(value) ?? 'null'
}

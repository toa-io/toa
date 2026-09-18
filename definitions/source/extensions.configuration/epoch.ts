import { createHash } from 'node:crypto'

/** The same for the same schema, whatever the key order it was written in. */
export function epoch(schema: object): string {
  return hash(schema)
}

/**
 * The same for the same deployed defaults. None hash as `{}`, which is what the values
 * service serves for them, so the component and the service compute one value.
 */
export function revision(defaults: object | undefined): string {
  return hash(defaults ?? {})
}

function hash(value: object): string {
  return createHash('sha256').update(canonical(value)).digest('hex')
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'

  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>
    const keys = Object.keys(object)
      .filter((key) => object[key] !== undefined)
      .sort()
    const entries = keys.map((key) => JSON.stringify(key) + ':' + canonical(object[key]))

    return '{' + entries.join(',') + '}'
  }

  return JSON.stringify(value) ?? 'null'
}

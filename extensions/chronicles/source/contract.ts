import type { Property } from '@toa.io/definitions/extensions.chronicles'

/**
 * What of a payload is written: the declared properties, at every depth, and nothing else. A
 * value that is not of its declared type is a payload the contract does not admit, which throws a
 * `Mismatch` naming where; `null` is admitted for any property, and an absent one stays absent.
 */
export function project(
  payload: object,
  properties: Record<string, Property>,
  path = ''
): Record<string, unknown> {
  const projected: Record<string, unknown> = {}

  for (const [name, property] of Object.entries(properties)) {
    const value = (payload as Record<string, unknown>)[name]

    if (value === undefined) continue

    projected[name] = fit(value, property, path === '' ? name : `${path}.${name}`)
  }

  return projected
}

function fit(value: unknown, property: Property, path: string): unknown {
  if (value === null) return null

  switch (property.type) {
    case 'string':
      if (typeof value !== 'string') throw new Mismatch(path, property)

      if (property.enum !== undefined && !property.enum.includes(value))
        throw new Mismatch(path, property)

      return value
    case 'integer':
      if (!Number.isInteger(value)) throw new Mismatch(path, property)

      return value
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value))
        throw new Mismatch(path, property)

      return value
    case 'boolean':
      if (typeof value !== 'boolean') throw new Mismatch(path, property)

      return value
    case 'object':
      if (typeof value !== 'object' || Array.isArray(value))
        throw new Mismatch(path, property)

      return project(value, property.properties ?? {}, path)
    case 'array':
      if (!Array.isArray(value)) throw new Mismatch(path, property)

      return value.map((item, index) => fit(item, property.items!, `${path}[${index}]`))
  }
}

/** A payload's value at `path` is not of the type its contract declares. */
export class Mismatch extends Error {
  public readonly path: string

  public constructor(path: string, property: Property) {
    super(
      property.enum === undefined
        ? `'${path}' is not of the type '${property.type}'`
        : `'${path}' is not one of ${property.enum.map((value) => `'${value}'`).join(', ')}`
    )

    this.path = path
  }
}

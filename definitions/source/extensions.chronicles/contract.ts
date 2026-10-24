import type { Contract } from './types.ts'

/**
 * Refuses a contract a store could not read in types of its own: every property is one of the
 * types the log has, described at every depth, and named so a store can name a column after it.
 * `where` says whose contract it is, for the message.
 */
export function check(contract: Contract, where: string): void {
  for (const [name, property] of Object.entries(contract.properties)) {
    if (OWN.has(name))
      throw new Error(
        `Chronicles declare '${where}.${name}', which is a column of the row: the payload's '${name}' is read before the contract, and is not declared.`
      )

    named(name, `${where}.${name}`)
    inspect(property, `${where}.${name}`, true)
  }
}

/** A name a store can name a column after, which it then need not quote. */
function named(name: string, path: string): void {
  if (!NAME.test(name))
    throw new Error(
      `Chronicles declare '${path}': a property is named by letters, digits and underscores from a letter or an underscore.`
    )
}

function inspect(property: unknown, path: string, described: boolean): void {
  if (typeof property !== 'object' || property === null || Array.isArray(property))
    throw new Error(`Chronicles declare '${path}', which is not a schema of a property.`)

  const schema = property as Record<string, unknown>

  for (const key of Object.keys(schema))
    if (!KEYS.has(key))
      throw new Error(
        `Chronicles declare '${path}' with '${key}', which the log has no type for.`
      )

  if (described && (typeof schema.description !== 'string' || schema.description === ''))
    throw new Error(`Chronicles declare '${path}' with no description.`)

  const type = schema.type

  if (typeof type !== 'string' || !TYPES.has(type))
    throw new Error(
      `Chronicles declare '${path}' of the type '${JSON.stringify(type)}', which is not one of ${[...TYPES].join(', ')}.`
    )

  if (schema.enum !== undefined && (type !== 'string' || !strings(schema.enum)))
    throw new Error(`Chronicles declare '${path}' with an enum that is not of strings.`)

  if (
    schema.format !== undefined &&
    (typeof schema.format !== 'string' || !SCALARS.has(type))
  )
    throw new Error(`Chronicles declare '${path}' with a format the type has none of.`)

  if (type === 'object') {
    const properties = schema.properties

    if (
      typeof properties !== 'object' ||
      properties === null ||
      Array.isArray(properties)
    )
      throw new Error(`Chronicles declare the object '${path}' with no properties.`)

    for (const [key, nested] of Object.entries(properties)) {
      named(key, `${path}.${key}`)
      inspect(nested, `${path}.${key}`, true)
    }
  } else if (schema.properties !== undefined)
    throw new Error(
      `Chronicles declare '${path}' with properties, which is not an object.`
    )

  if (type === 'array') {
    if (schema.items === undefined)
      throw new Error(`Chronicles declare the array '${path}' with no items.`)

    // what the array is of is told by the array's description
    inspect(schema.items, `${path}[]`, false)
  } else if (schema.items !== undefined)
    throw new Error(`Chronicles declare '${path}' with items, which is not an array.`)
}

function strings(values: unknown): boolean {
  return (
    Array.isArray(values) &&
    values.length > 0 &&
    values.every((value) => typeof value === 'string')
  )
}

const SCALARS = new Set(['string', 'integer', 'number', 'boolean'])
const TYPES = new Set([...SCALARS, 'object', 'array'])
const KEYS = new Set(['type', 'description', 'enum', 'format', 'properties', 'items'])
const NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** What a row of the log says of itself, which a view of a label has as columns of its own. */
const OWN = new Set(['id', 'time', 'received', 'entity', 'version', 'identity', 'trace'])

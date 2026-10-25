import { id, literal } from './ddl.ts'
import type { Property } from '@toa.io/definitions/extensions.chronicles'
import type { Field } from '../Provider.ts'

/**
 * How a declared property is read from the payload in its type, by `JSONExtract`, which reads what
 * is not of the type as `NULL` rather than failing the query — a row written under an earlier
 * contract is read by the one there is now.
 */

/** The fields of a contract, at every depth, each with the type its column reads it as. */
export function fields(properties: Record<string, Property>, prefix = ''): Field[] {
  const found: Field[] = []

  for (const [name, property] of Object.entries(properties)) {
    if (empty(property)) continue

    const path = prefix === '' ? name : `${prefix}.${name}`

    const field: Field = { path, type: type(property), description: property.description }

    // a property of a property is read inside the one that holds it
    if (prefix === '') field.read = extract(name, property)

    found.push(field)

    const nested = property.type === 'array' ? property.items! : property

    if (nested.type === 'object') found.push(...fields(nested.properties!, path))
  }

  return found
}

/** What a property reads as, `NULL` aside. */
export function type(property: Property): string {
  switch (property.type) {
    case 'object':
      return `Tuple(${members(property, type)})`
    case 'array':
      return `Array(${type(property.items!)})`
    default:
      return scalar(property)
  }
}

/** The column of a property: a value of the type, or `NULL` where it was not one. */
function column(property: Property): string {
  switch (property.type) {
    case 'object':
      return `Tuple(${members(property, column)})`
    case 'array':
      return `Array(${column(property.items!)})`
    default:
      return property.enum === undefined
        ? `Nullable(${scalar(property)})`
        : 'LowCardinality(Nullable(String))'
  }
}

function scalar(property: Property): string {
  if (property.enum !== undefined) return 'LowCardinality(String)'

  const formatted = property.format === undefined ? undefined : FORMATS[property.format]

  return formatted?.type === property.type ? formatted.as : SCALARS[property.type]
}

function members(property: Property, of: (property: Property) => string): string {
  return Object.entries(property.properties!)
    .filter(([, nested]) => !empty(nested))
    .map(([name, nested]) => `${name} ${of(nested)}`)
    .join(', ')
}

/**
 * An object is read from the JSON of its paths, which is an object however few of them a row has;
 * anything else from the JSON of its value, which is `null` where a row has none.
 */
function extract(name: string, property: Property): string {
  const json =
    property.type === 'object'
      ? `toJSONString(payload.^${id(name)})`
      : `ifNull(toJSONString(payload.${id(name)}), 'null')`

  return `JSONExtract(${json}, ${literal(column(property))})`
}

/** An object of no properties is no column: a tuple of nothing is no type. */
function empty(property: Property): boolean {
  const nested = property.type === 'array' ? property.items! : property

  return (
    nested.type === 'object' &&
    Object.values(nested.properties ?? {}).every((member) => empty(member))
  )
}

const SCALARS: Record<string, string> = {
  string: 'String',
  integer: 'Int64',
  number: 'Float64',
  boolean: 'Bool'
}

const FORMATS: Record<string, { type: string; as: string }> = {
  'date-time': { type: 'string', as: "DateTime64(3, 'UTC')" },
  'iso-date-time': { type: 'string', as: "DateTime64(3, 'UTC')" },
  date: { type: 'string', as: 'Date32' },
  time: { type: 'string', as: 'Time64(3)' },
  'iso-time': { type: 'string', as: 'Time64(3)' },
  uuid: { type: 'string', as: 'UUID' },
  ipv4: { type: 'string', as: 'IPv4' },
  ipv6: { type: 'string', as: 'IPv6' },
  int32: { type: 'integer', as: 'Int32' },
  int64: { type: 'integer', as: 'Int64' },
  float: { type: 'number', as: 'Float32' },
  double: { type: 'number', as: 'Float64' }
}

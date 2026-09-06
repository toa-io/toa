import { read } from './shape'
import type { Method, Schema } from '@/discovery'

/**
 * One value a call takes from whoever makes it. A route variable and a querystring
 * parameter are asked for the same way and go to different places, which is what `where`
 * says; `key` is what the form holds the answer under, and is the position in the template
 * rather than the name, because a template may take `*` twice.
 */
export interface Field {
  key: string
  /** what it is called: the template's name for a variable, the parameter's own for a query */
  name: string
  where: 'route' | 'query'
  /** what the resource says of it, where it says anything */
  schema: Schema | null
  /** the path does not resolve without it; a querystring parameter is always spared */
  required: boolean
}

/** The rest of a path, which is the one variable that may carry separators of its own. */
const TAIL = '**'

/** What a caller fills in before the call can be made, in the order it is asked for. */
export function fields(route: string, of: Method): Field[] {
  const found: Field[] = []

  parts(route).forEach((part, at) => {
    const name = part[0] === ':' ? part.slice(1) : part === '*' || part === TAIL ? part : null

    if (name === null) return

    found.push({
      key: `route:${at}`,
      name,
      where: 'route',
      // a `map:segments` renaming answers the variable under the property it fills, so a
      // schema is what the template happens to agree with rather than what it is filed by
      schema: of.route?.[name] ?? null,
      required: true,
    })
  })

  for (const [name, schema] of Object.entries(of.query ?? {}))
    found.push({ key: `query:${name}`, name, where: 'query', schema, required: false })

  return found
}

/** Whether the call carries a body of its own. */
export function bodied(of: Method): boolean {
  return of.input !== undefined && of.input !== null && Object.keys(of.input).length > 0
}

/** The path the call is made at: the template with its variables filled, and a querystring. */
export function address(route: string, fields: Field[], values: Values): string {
  const filled = parts(route).map((part, at) => {
    const field = fields.find((field) => field.key === `route:${at}`)

    return field === undefined ? part : encoded(values[field.key] ?? '', field.name === TAIL)
  })

  const search = new URLSearchParams()

  for (const field of fields)
    if (field.where === 'query' && (values[field.key] ?? '') !== '')
      search.set(field.name, values[field.key]!)

  const query = search.toString()

  // a route is addressed with the trailing slash it is declared without; the trunk is bare
  return (
    '/' + (filled.length === 0 ? '' : filled.join('/') + '/') + (query === '' ? '' : '?' + query)
  )
}

/** A body to start from: what the schema says the call takes, with nothing filled in. */
export function skeleton(schema: unknown): string {
  return JSON.stringify(sample(schema, 0), null, 2)
}

/** What a value of it is, in a word, which is what a field says where it says nothing else. */
export function hint(schema: Schema | null): string {
  if (schema === null) return 'string'

  return read(schema)[0]?.type ?? 'string'
}

/** A route as an identifier: `/pots/:id` is `pots-id`, and the trunk is `root`. */
export function slug(route: string): string {
  const name = route.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return name === '' ? 'root' : name
}

export type Values = Record<string, string>

function parts(route: string): string[] {
  return route.split('/').filter((part) => part !== '')
}

/** A variable is one segment, so its value is one; the rest of a path is every segment left. */
function encoded(value: string, tail: boolean): string {
  return tail
    ? value.split('/').map(encodeURIComponent).join('/')
    : encodeURIComponent(value)
}

/** How deep a skeleton is worth going. A schema that recurses does not end on its own. */
const DEPTH = 5

function sample(schema: unknown, depth: number): unknown {
  if (typeof schema !== 'object' || schema === null || depth > DEPTH) return null

  const of = schema as Record<string, unknown>

  if (Array.isArray(of.enum)) return of.enum[0] ?? null

  if (of.const !== undefined) return of.const

  const properties = of.properties as Record<string, unknown> | undefined

  if (properties !== undefined) {
    const object: Record<string, unknown> = {}

    for (const [name, property] of Object.entries(properties))
      object[name] = sample(property, depth + 1)

    return object
  }

  if (of.items !== undefined) return [sample(of.items, depth + 1)]

  return empty(typeof of.type === 'string' ? of.type : null)
}

function empty(type: string | null): unknown {
  switch (type) {
    case 'string':
      return ''
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return null
  }
}

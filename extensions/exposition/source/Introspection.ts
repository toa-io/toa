import type { Remote } from '@toa.io/core'
import type { Context } from './HTTP/index.js'

export interface Introspection {
  /**
   * What the route states this method is. The operation states what it is too, and that is
   * not this: an operation is written without knowledge of any route, and a method is an
   * operation and a route together — the same operation mounted twice is two methods, and
   * one sentence cannot be true of both. The operation's own is for the Introspection.
   */
  description?: string

  /** what a person is shown where a client lists this method, which a name is not */
  title?: string

  /** whether reaching it is being the identity it is about — `auth:id` */
  private?: boolean

  /** whether reaching it takes a role — `auth:role` */
  protected?: boolean

  /** and whether that role is one of the `system` scope */
  system?: boolean

  /** whether the route publishes this method to a model — [`mcp:tool`](mcp.md) */
  mcp?: boolean
  route?: Record<string, Schema>
  query?: Record<string, Schema>
  input?: Schema
  output?: Schema
  errors?: string[]
}

export type Schema = Awaited<ReturnType<Remote['explain']>>['input']

/**
 * The same request, as a description of a resource rather than a call to one. A directive
 * that answers differently to the two reads `exploratory` — `Anonymous` is the one that
 * does, because the rule refusing a credential at an `anonymous` route is about a reply a
 * cache would hold, and a description is not one.
 */
export function describing(context: Context): Context {
  return Object.create(context, {
    exploratory: { value: true, enumerable: true }
  }) as Context
}

/**
 * The same, in the order the shape states — whatever order the families that filled it ran
 * in. What a resource says about itself is read, so it is written the way it is documented.
 */
export function order(introspection: Introspection): Introspection {
  const ordered: Introspection = {}

  for (const key of KEYS)
    if (introspection[key] !== undefined) (ordered[key] as unknown) = introspection[key]

  return ordered
}

const KEYS = [
  'title',
  'description',
  'private',
  'protected',
  'system',
  'mcp',
  'route',
  'query',
  'input',
  'output',
  'errors'
] as const

/**
 * The schema of one input property, taken out of it: a property another family fills is
 * not the caller's to send, and what took it says where it comes from instead.
 */
export function take(carrier: Carrier, property: string): Schema | undefined {
  const input = carrier.input as Shape | null | undefined
  const properties = input?.properties

  if (
    input === undefined ||
    input === null ||
    properties === undefined ||
    !(property in properties)
  )
    return undefined

  const schema = properties[property]

  delete properties[property]

  if (input.required !== undefined)
    input.required = input.required.filter((name) => name !== property)

  return schema
}

/**
 * A schema restricted to the properties a whitelist admits, and an array's items where it
 * describes an array. What is not an object of properties is left alone: a whitelist has
 * nothing to say about a string.
 */
export function restrict(
  schema: Schema | undefined,
  allowed: Set<string>
): Schema | undefined {
  const shape = schema as Shape | null | undefined

  if (shape === undefined || shape === null) return schema

  if (shape.items !== undefined)
    return { ...shape, items: restrict(shape.items, allowed) } as unknown as Schema

  if (shape.properties === undefined) return schema

  const properties: Record<string, Schema> = {}

  for (const [name, property] of Object.entries(shape.properties))
    if (allowed.has(name)) properties[name] = property

  const restricted: Shape = { ...shape, properties }

  if (shape.required !== undefined)
    restricted.required = shape.required.filter((name) => allowed.has(name))

  return restricted as unknown as Schema
}

/**
 * What a schema is read as here: the keywords these narrow, and whatever else it carries.
 * `Schema` as core declares it requires `properties`, which a schema of a string has not,
 * so the two are cast through rather than assigned.
 */
/** Whatever states an input: an explanation as the operation gave it, or as a route left it. */
interface Carrier {
  input?: Schema
}

interface Shape {
  properties?: Record<string, Schema>
  required?: string[]
  items?: Schema
  [keyword: string]: unknown
}

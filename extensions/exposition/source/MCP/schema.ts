import type { Introspection, Schema } from '../Introspection.ts'
import type { Annotations } from './types.ts'

/**
 * What a tool takes, which is what the procedure takes: a route variable by the name the
 * template gives it, the querystring under a name of its own, and what is left is the body.
 *
 * A `map:headers` property is not here: a call carries no headers of its own, so there is
 * nowhere for a model to put one.
 */
// eslint-disable-next-line max-params
export function input(
  introspection: Introspection,
  variables: string[],
  selection: Record<string, Schema> | null
): object {
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  /*
   * By the name the template gives it, which is what the tool's own name states and what
   * resolving it consumes. A `map:segments` renaming is the gateway's, as invisible here as
   * it is to whoever writes the path; and a variable the operation does not declare has no
   * schema of its own, being a segment.
   */
  for (const variable of variables) {
    properties[variable] = introspection.route?.[variable] ?? { type: 'string' }
    required.push(variable)
  }

  /*
   * It is a querystring on the wire, which is nothing a model knows or needs to; what it is
   * to a caller is the part of a call that picks what the call is about. What selects
   * records is `selection` on the method, and is merged here because here it is something
   * the caller sends.
   */
  const query = { ...introspection.query, ...selection }

  if (Object.keys(query).length > 0)
    properties.query = {
      type: 'object',
      description:
        'Which records the call works on: what to match, in what order, ' +
        'and how many at once.',
      properties: query
    }

  const body = introspection.input as Shape | null | undefined

  if (body?.properties !== undefined) {
    Object.assign(properties, body.properties)
    required.push(...(body.required ?? []))
  }

  const schema: Record<string, unknown> = { type: 'object', properties }

  if (required.length > 0) schema.required = required

  // what a name does not state is not a parameter, and a model should not invent one
  schema.additionalProperties = false

  return schema
}

/**
 * What a tool answers with, where that is worth stating. An operation's `output` is optional
 * and normalizes to `{}`, which describes nothing — and a schema the revision would have the
 * reply validated against is worse said emptily than left unsaid.
 */
export function output(introspection: Introspection): object | undefined {
  const schema = introspection.output as Shape | null | undefined

  if (schema === undefined || schema === null) return undefined

  return Object.keys(schema).length === 0 ? undefined : (schema as object)
}

/** What the verb says of the call, which the revision has a client treat as a hint. */
export function annotations(verb: string): Annotations | undefined {
  const value: Annotations = {}

  if (verb === 'GET' || verb === 'HEAD') value.readOnlyHint = true

  if (verb === 'DELETE') value.destructiveHint = true

  if (verb === 'PUT' || verb === 'DELETE') value.idempotentHint = true

  return Object.keys(value).length === 0 ? undefined : value
}

interface Shape {
  properties?: Record<string, Schema>
  required?: string[]
}

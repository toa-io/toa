import * as schemas from './schemas.ts'
import { RequestContractException } from '../exceptions.ts'
import { Contract } from './contract.ts'
import type { Schema } from '@toa.io/schemas'
import type { Refusal } from './contract.ts'
import type { JSONSchema } from './schemas.ts'

/** What an operation states about itself, and answers when asked to explain. */
export interface Explanation {
  description?: string
  /**
   * Whether the same call arriving twice changes state once. Said, because a caller cannot tell
   * it from an answer that says nothing, and what it changes is whether a retry is safe to make.
   */
  once?: boolean
  /**
   * Whether a call to it names the process it goes to. Said, because the caller is the one who
   * has to name one, and a call that names none is refused.
   */
  stateful?: boolean
  input?: JSONSchema | null
  output?: JSONSchema | null
  errors?: Array<string | number>
}

export interface Definition extends Explanation {
  type?: string
  scope?: string
  query?: boolean
}

/** What the operation works on, as the manifest declares it. */
export interface Entity {
  properties: Record<string, JSONSchema>
  required?: string[]
}

export class Request extends Contract {
  public readonly discovery: Explanation = {}

  public static override Exception: Refusal =
    RequestContractException as unknown as Refusal

  public constructor(schema: Schema, definition: Definition, entity?: Entity) {
    super(schema)

    for (const key of ['description', 'once', 'stateful', 'input', 'output', 'errors'] as const)
      if (definition[key] !== undefined)
        (this.discovery as Record<string, unknown>)[key] = definition[key]

    /*
     * An operation that states no output states an empty schema, which every reply fits —
     * and which says nothing to whoever reads it. What its type answers does, so that is
     * said here instead. Here and not in the definition, because the definition is what a
     * reply is held to: a projection is a lawful answer, and describing one is not the same
     * as requiring it.
     */
    if (empty(this.discovery.output)) {
      const answered = answers(definition, entity)

      if (answered !== undefined) this.discovery.output = answered
    }
  }

  public static schema(
    definition: Definition,
    entity?: { properties: Record<string, JSONSchema> }
  ): JSONSchema {
    // `source` is not among these: the framework stamps it and whoever reads it takes the keys
    // it knows, so holding it to a schema would only fail calls from a peer that stamps one more
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        /*
         * Listed, and not required. `additionalProperties` already admits it, and a callee skips
         * this contract altogether for an `authentic` request — which every request from a `Call`
         * is — so requiring it would refuse nothing on the side where a missing identity matters,
         * and would refuse every request built by hand on the side where it never is. An
         * operation that declares `once` raises on a request without one instead.
         */
        id: { type: 'string' },
        authentic: { type: 'boolean' },
        task: { type: 'boolean' },
        // what a caller receives of the output, which every operation admits
        output: { type: 'array', uniqueItems: true, items: { type: 'string' } }
      },
      additionalProperties: true
    }

    const required: string[] = []

    if (definition.input !== undefined) {
      schema.properties.input = definition.input
      required.push('input')
    } else schema.properties.input = { type: 'null' }

    if (entity === undefined) definition.query = false

    if (definition.query === true) required.push('query')

    if (definition.query === false) schema.properties.query = { type: 'null' }

    if (definition.query !== false) {
      const query = structuredClone(schemas.query)

      query.properties.id = entity?.properties.id

      if (definition.type === 'observation') delete query.properties.version
      else delete query.properties.projection

      if (definition.type !== 'observation' || definition.scope !== 'objects') {
        delete query.properties.omit
        delete query.properties.limit
      } else if (query.required === undefined) query.required = ['limit']
      else query.required.push('limit')

      schema.properties.query = query
    }

    if (required.length > 0) schema.required = required

    return schema
  }
}

/**
 * What an operation of this type answers, where it did not say.
 *
 * A transition, an observation and an assignment work on the Entity Object, so that is what
 * they answer — a set of them where the scope is a set. A computation neither uses the scope
 * nor produces one, and an effect answers whatever it computed, so neither is guessed at.
 * A stream is not a value with a schema, and is not one either.
 *
 * What the entity requires is said as well. It is a description and nothing is held to it —
 * an operation answering a projection says so by declaring its own output — and a shape
 * whose every property reads as optional says less than it knows.
 */
function answers(definition: Definition, entity?: Entity): JSONSchema | undefined {
  if (entity === undefined || !ENTITY.has(definition.type as string)) return undefined

  const object: JSONSchema = {
    type: 'object',
    properties: entity.properties,
    ...(entity.required === undefined ? {} : { required: entity.required })
  }

  if (definition.scope === 'objects')
    return { type: 'array', items: object } as JSONSchema

  return definition.scope === 'object' || definition.scope === 'changeset'
    ? object
    : undefined
}

/** The types whose subject is the Entity Object; see `documentation/design.md`. */
const ENTITY = new Set(['transition', 'observation', 'assignment'])

/** A schema that states nothing, which is what an operation saying nothing normalizes to. */
function empty(schema: JSONSchema | null | undefined): boolean {
  return schema === undefined || schema === null || Object.keys(schema).length === 0
}

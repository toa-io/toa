import * as schemas from './schemas.js'
import { RequestContractException } from '../exceptions.js'
import { Contract } from './contract.js'
import type { Schema } from '@toa.io/schemas'
import type { Refusal } from './contract.js'
import type { JSONSchema } from './schemas.js'

/** What an operation states about itself, and answers when asked to explain. */
export interface Explanation {
  description?: string
  input?: JSONSchema | null
  output?: JSONSchema | null
  errors?: Array<string | number>
}

export interface Definition extends Explanation {
  type?: string
  scope?: string
  query?: boolean
}

export class Request extends Contract {
  public readonly discovery: Explanation = {}

  public static override Exception: Refusal =
    RequestContractException as unknown as Refusal

  public constructor (schema: Schema, definition: Definition) {
    super(schema)

    for (const key of ['description', 'input', 'output', 'errors'] as const)
      if (definition[key] !== undefined)
        (this.discovery as Record<string, unknown>)[key] = definition[key]
  }

  public static schema (definition: Definition, entity?: { schema: JSONSchema }): JSONSchema {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        authentic: { type: 'boolean' },
        task: { type: 'boolean' },
        source: structuredClone(schemas.source)
      },
      additionalProperties: true
    }

    const required: string[] = []

    if (definition.input !== undefined) {
      schema.properties.input = definition.input
      required.push('input')
    } else
      schema.properties.input = { type: 'null' }

    if (entity === undefined)
      definition.query = false

    if (definition.query === true)
      required.push('query')

    if (definition.query === false)
      schema.properties.query = { type: 'null' }

    if (definition.query !== false) {
      const query = structuredClone(schemas.query)

      query.properties.id = entity?.schema.properties.id

      if (definition.type === 'observation') {
        delete query.properties.version
      } else {
        delete query.properties.projection
      }

      if (definition.type !== 'observation' || definition.scope !== 'objects') {
        delete query.properties.omit
        delete query.properties.limit
      } else {
        if (query.required === undefined) query.required = ['limit']
        else query.required.push('limit')
      }

      schema.properties.query = query
    }

    if (required.length > 0)
      schema.required = required

    return schema
  }
}

/** A JSON Schema, loose because it is handed to a validator and edited by the contracts. */
export type JSONSchema = Record<string, any>

export const query: JSONSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    ids: { type: 'array', uniqueItems: true, minItems: 1, items: { type: 'string' } },
    version: { type: 'integer', minimum: 0 },
    criteria: { type: 'string' },
    search: { type: 'string' },
    sample: { type: 'number' },
    omit: { type: 'integer', minimum: 0 },
    limit: { type: 'integer', minimum: 0 },
    sort: {
      type: 'array',
      uniqueItems: true,
      minItems: 1,
      items: { type: 'string', pattern: '^\\w{1,32}(?::(?:asc|desc))?$' }
    },
    projection: {
      type: 'array',
      uniqueItems: true,
      minItems: 1,
      items: { type: 'string', not: { const: 'id' } }
    },
    deleted: { type: 'boolean' }
  },
  additionalProperties: false
}

export const error: JSONSchema = {
  type: 'object',
  properties: {
    code: { anyOf: [{ type: 'integer' }, { type: 'string' }] },
    message: { type: 'string' }
  },
  required: ['code']
}

/*
 * Origin of a call, see `Source`.
 * Deliberately permissive on required properties: the contract throws on a mismatch,
 * and a strict union would turn a partially stamped source into a failed business call.
 * `additionalProperties: false` combined with `removeAdditional` is what matters here —
 * it strips whatever a peer puts in, bounding the cardinality of the resulting map.
 */
export const source: JSONSchema = {
  type: 'object',
  properties: {
    namespace: { type: 'string', maxLength: 64 },
    component: { type: 'string', maxLength: 64 },
    operation: { type: 'string', maxLength: 64 },
    event: { type: 'string', maxLength: 64 },
    service: { type: 'string', maxLength: 64 }
  },
  additionalProperties: false
}

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

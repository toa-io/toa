import { it } from 'node:test'
import assert from 'node:assert/strict'

import { fields, type } from './views.ts'
import type { Contract } from '@toa.io/definitions/extensions.chronicles'

const contract: Contract = {
  description: 'An order was placed',
  properties: {
    total: { type: 'integer', description: 'The amount, in cents' },
    status: { type: 'string', enum: ['new', 'paid'], description: 'Where it is' },
    placed: { type: 'string', format: 'date-time', description: 'When' },
    shipping: {
      type: 'object',
      description: 'Where it goes',
      properties: { country: { type: 'string', description: 'ISO 3166' } }
    },
    items: {
      type: 'array',
      description: 'What was bought',
      items: {
        type: 'object',
        properties: { sku: { type: 'string', description: 'The product' } }
      }
    },
    nothing: { type: 'object', description: 'Empty', properties: {} }
  }
}

it('should tell how to read each property in its type, or NULL', () => {
  const read: Record<string, string> = Object.fromEntries(
    fields(contract.properties)
      .filter((field) => field.read !== undefined)
      .map((field) => [field.path, field.read!])
  )

  assert.equal(
    read.total,
    "JSONExtract(ifNull(toJSONString(payload.`total`), 'null'), 'Nullable(Int64)')"
  )
  assert.match(read.status, /'LowCardinality\(Nullable\(String\)\)'\)$/)
  assert.match(read.placed, /'Nullable\(DateTime64\(3, \\'UTC\\'\)\)'\)$/)
  assert.equal(
    read.shipping,
    "JSONExtract(toJSONString(payload.^`shipping`), 'Tuple(country Nullable(String))')"
  )
  assert.match(read.items, /'Array\(Tuple\(sku Nullable\(String\)\)\)'\)$/)
  assert.equal(read['shipping.country'], undefined)
  assert.equal(read.nothing, undefined)
})

it('should tell the fields at every depth, in the types they read as', () => {
  assert.deepEqual(
    fields(contract.properties).map(({ path, type }) => [path, type]),
    [
      ['total', 'Int64'],
      ['status', 'LowCardinality(String)'],
      ['placed', "DateTime64(3, 'UTC')"],
      ['shipping', 'Tuple(country String)'],
      ['shipping.country', 'String'],
      ['items', 'Array(Tuple(sku String))'],
      ['items.sku', 'String']
    ]
  )
})

it('should read a format only of the type it is of', () => {
  assert.equal(type({ type: 'integer', format: 'int32', description: 'x' }), 'Int32')
  assert.equal(type({ type: 'string', format: 'int32', description: 'x' }), 'String')
  assert.equal(type({ type: 'string', format: 'email', description: 'x' }), 'String')
  assert.equal(type({ type: 'string', format: 'uuid', description: 'x' }), 'UUID')
})

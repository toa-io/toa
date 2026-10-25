import { it } from 'node:test'
import assert from 'node:assert/strict'

import { fields, select, type } from './views.ts'
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

it('should read each property in its type, or NULL', () => {
  const sql = select({ kind: 'event', label: 'store.orders.created', contract })

  assert.match(sql, /^SELECT id, time, entity, version, identity, trace, /)
  assert.match(
    sql,
    /JSONExtract\(ifNull\(toJSONString\(payload\.`total`\), 'null'\), 'Nullable\(Int64\)'\) AS `total`/
  )
  assert.match(sql, /'LowCardinality\(Nullable\(String\)\)'\) AS `status`/)
  assert.match(sql, /'Nullable\(DateTime64\(3, \\'UTC\\'\)\)'\) AS `placed`/)
  assert.match(
    sql,
    /JSONExtract\(toJSONString\(payload\.\^`shipping`\), 'Tuple\(country Nullable\(String\)\)'\) AS `shipping`/
  )
  assert.match(sql, /'Array\(Tuple\(sku Nullable\(String\)\)\)'\) AS `items`/)
  assert.doesNotMatch(sql, /nothing/)
  assert.match(sql, / FROM events FINAL WHERE label = 'store\.orders\.created'$/)
})

it('should read a state of a component', () => {
  const sql = select({ kind: 'state', component: 'store.orders', contract })

  assert.match(sql, /^SELECT entity, version, identity, time, /)
  assert.match(sql, / FROM states FINAL WHERE component = 'store\.orders'$/)
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

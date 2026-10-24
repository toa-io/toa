import { it } from 'node:test'
import assert from 'node:assert/strict'

import { Mismatch, project } from './contract.ts'
import type { Property } from '@toa.io/definitions/extensions.chronicles'

const properties: Record<string, Property> = {
  total: { type: 'integer', description: 'The amount' },
  status: { type: 'string', enum: ['new', 'paid'], description: 'Where it is' },
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
  tags: { type: 'array', description: 'Labels', items: { type: 'string' } }
}

it('should keep what is declared, at every depth, and nothing else', () => {
  assert.deepEqual(
    project(
      {
        total: 120,
        email: 'bob@example.com',
        shipping: { country: 'DE', phone: '+49' },
        items: [{ sku: 'T-1', note: 'gift' }],
        tags: ['a']
      },
      properties
    ),
    { total: 120, shipping: { country: 'DE' }, items: [{ sku: 'T-1' }], tags: ['a'] }
  )
})

it('should keep null, and leave out what is absent', () => {
  assert.deepEqual(project({ total: null }, properties), { total: null })
})

it('should refuse a value of another type, saying where', () => {
  for (const [payload, path] of [
    [{ total: '120' }, 'total'],
    [{ total: 1.5 }, 'total'],
    [{ status: 'lost' }, 'status'],
    [{ shipping: 'DE' }, 'shipping'],
    [{ shipping: { country: 7 } }, 'shipping.country'],
    [{ items: [{ sku: 'a' }, { sku: 3 }] }, 'items[1].sku'],
    [{ tags: 'a' }, 'tags']
  ] as const)
    assert.throws(
      () => project(payload, properties),
      (error: unknown) => error instanceof Mismatch && error.path === path
    )
})

import { it } from 'node:test'
import assert from 'node:assert/strict'
import { manifest } from './manifest.ts'
import type { Contract, Declared } from './types.ts'
import type { Manifest } from '@toa.io/norm'

const component = {
  name: 'orders',
  namespace: 'store',
  entity: { properties: { customer: {}, total: {} } },
  events: { created: {}, sync: {}, snapshot: {} }
} as unknown as Manifest

const contract: Contract = {
  description: 'An order was placed',
  properties: { total: { type: 'integer', description: 'The amount, in cents' } }
}

it('should be the events, the state and the facts a component declares', () => {
  assert.deepEqual(
    manifest(
      {
        events: { created: contract },
        state: { event: 'sync', ...contract },
        facts: { searched: contract }
      },
      component
    ),
    {
      events: { created: contract },
      state: { event: 'sync', ...contract },
      facts: { searched: contract },
      identity: 'identity'
    }
  )
})

it('should be none for a component that declares nothing', () => {
  assert.deepEqual(manifest(null, component), {
    events: {},
    facts: {},
    identity: 'identity'
  })
})

it('should refuse the list of events', () => {
  assert.throws(
    () => manifest(['created'] as unknown as Declared, component),
    /Invalid chronicles declaration/
  )
})

it('should refuse a state that is not an event of the component', () => {
  assert.throws(
    () => manifest({ state: { event: 'whole', ...contract } }, component),
    /Chronicles of 'store.orders' name 'whole', which is not an event of the component/
  )
})

it('should refuse a label that is not an event of the component', () => {
  assert.throws(
    () => manifest({ events: { shipped: contract } }, component),
    /Chronicles of 'store.orders' name 'shipped', which is not an event of the component/
  )
})

it('should refuse a contract with no description', () => {
  assert.throws(
    () =>
      manifest(
        { events: { created: { properties: {} } as unknown as Contract } },
        component
      ),
    /Invalid chronicles declaration/
  )
})

it('should accept nested objects and arrays of them', () => {
  const nested: Contract = {
    description: 'An order was placed',
    properties: {
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
      tags: { type: 'array', description: 'Labels', items: { type: 'string' } },
      placed: { type: 'string', format: 'date-time', description: 'When' },
      status: { type: 'string', enum: ['new', 'paid'], description: 'Where it is' }
    }
  }

  assert.doesNotThrow(() => manifest({ events: { created: nested } }, component))
})

it('should refuse a property with no description, at any depth', () => {
  for (const properties of [
    { total: { type: 'integer' } },
    {
      shipping: {
        type: 'object',
        description: 'Where it goes',
        properties: { country: { type: 'string' } }
      }
    },
    {
      items: {
        type: 'array',
        description: 'What was bought',
        items: { type: 'object', properties: { sku: { type: 'string' } } }
      }
    }
  ])
    assert.throws(
      () =>
        manifest(
          {
            facts: {
              searched: { description: 'Searched', properties } as unknown as Contract
            }
          },
          component
        ),
      /Chronicles declare 'store\.orders\.searched\.[a-z.[\]]+' with no description/
    )
})

it('should refuse what the log has no type for', () => {
  for (const [property, pattern] of [
    [{ type: 'null', description: 'x' }, /of the type '"null"'/],
    [{ type: ['string', 'null'], description: 'x' }, /of the type/],
    [
      { oneOf: [], type: 'string', description: 'x' },
      /with 'oneOf', which the log has no type for/
    ],
    [{ type: 'object', description: 'x' }, /the object '.+' with no properties/],
    [{ type: 'array', description: 'x' }, /the array '.+' with no items/],
    [{ type: 'integer', enum: [1], description: 'x' }, /an enum that is not of strings/],
    [
      { type: 'object', format: 'uuid', properties: {}, description: 'x' },
      /a format the type has none of/
    ]
  ] as const)
    assert.throws(
      () =>
        manifest(
          {
            facts: {
              searched: {
                description: 'Searched',
                properties: { value: property }
              } as unknown as Contract
            }
          },
          component
        ),
      pattern
    )
})

it('should refuse a property a store could not name a column after', () => {
  assert.throws(
    () =>
      manifest(
        {
          facts: {
            searched: {
              description: 'Searched',
              properties: { 'the query': { type: 'string', description: 'What' } }
            }
          }
        },
        component
      ),
    /a property is named by letters, digits and underscores/
  )
})

it('should refuse a property that is a column of the row', () => {
  assert.throws(
    () =>
      manifest(
        {
          facts: {
            searched: {
              description: 'Searched',
              properties: { time: { type: 'string', description: 'When' } }
            }
          }
        },
        component
      ),
    /'store.orders.searched.time', which is a column of the row/
  )
})

it('should take the identity from the property a component names, or none', () => {
  assert.equal(manifest({ identity: 'customer' }, component).identity, 'customer')
  assert.equal(manifest({ identity: null }, component).identity, null)
})

it('should refuse an identity that is not a property of the entity', () => {
  assert.throws(
    () => manifest({ identity: 'buyer' }, component),
    /name the identity 'buyer', which is not a property of the entity/
  )
})

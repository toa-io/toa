import { it } from 'node:test'
import assert from 'node:assert/strict'

import { exceptions } from '@toa.io/core'
import { row, state } from './Recorder.ts'
import type { Of } from './Recorder.ts'

const of: Of = {
  contract: {
    description: 'An order',
    properties: { total: { type: 'integer', description: 'The amount' } }
  },
  identity: null,
  timestamp: 'UPDATED'
}

it('should say which record changed and its version, as the payload says', () => {
  const written = row(
    'store.orders.snapshot',
    'store.orders',
    {
      id: 'e1',
      payload: { id: 'b5c8', VERSION: 3, total: 120 },
      telemetry: '00-abc-def-01'
    },
    of
  )

  assert.equal(written.id, 'e1')
  assert.equal(written.entity, 'b5c8')
  assert.equal(written.version, 3)
  assert.equal(written.trace, '00-abc-def-01')
})

it('should say when the change was made by the property the component names', () => {
  const written = row(
    'store.orders.paid',
    'store.orders',
    {
      id: 'e2',
      payload: { UPDATED: 1761200000000 },
      time: 1761200005000
    },
    of
  )

  assert.equal(written.time, 1761200000000)
})

it('should say when by the message where the payload does not', () => {
  for (const timestamp of ['UPDATED', null]) {
    const written = row(
      'store.orders.paid',
      'store.orders',
      {
        id: 'e3',
        payload: { UPDATED: 1761200000000 },
        time: 1761200005000
      },
      { ...of, timestamp }
    )

    assert.equal(written.time, timestamp === null ? 1761200005000 : 1761200000000)
  }

  const unsaid = row(
    'store.orders.paid',
    'store.orders',
    {
      id: 'e4',
      payload: { total: 1 },
      time: 1761200005000
    },
    of
  )

  assert.equal(unsaid.time, 1761200005000)
})

it('should be when it is taken, of a message that says nothing of when', () => {
  const before = Date.now()
  const written = row('store.orders.paid', 'store.orders', { id: 'e5', payload: {} }, of)

  assert.ok(written.time >= before)
})

it('should keep a payload that says nothing of the entity', () => {
  const written = row(
    'store.orders.paid',
    'store.orders',
    { id: 'e6', payload: { total: 120 } },
    of
  )

  assert.equal(written.entity, null)
  assert.equal(written.version, null)
  assert.deepEqual(written.payload, { total: 120 })
})

it('should name a message from outside Toa by what it says', () => {
  const one = row('store.orders.paid', 'store.orders', { payload: { total: 1 } }, of)
  const same = row('store.orders.paid', 'store.orders', { payload: { total: 1 } }, of)

  assert.equal(one.id, same.id)
})

it('should keep an entity as its state renders it', () => {
  const kept = state(
    'store.orders.sync',
    'store.orders',
    {
      id: 'e7',
      payload: { id: 'b5c8', VERSION: 4, UPDATED: 1761200000000, total: 140 }
    },
    of
  )

  assert.equal(kept.component, 'store.orders')
  assert.equal(kept.entity, 'b5c8')
  assert.equal(kept.version, 4)
  assert.equal(kept.time, 1761200000000)
})

it('should refuse a state that does not say which entity and version it is, as permanent', () => {
  assert.throws(
    () =>
      state(
        'store.orders.snapshot',
        'store.orders',
        { id: 'e8', payload: { total: 1 } },
        of
      ),
    (error: any) =>
      error.code === exceptions.codes.EntityContract && exceptions.permanent(error)
  )
})

it('should say whose a row is by the property the component names, or nobody', () => {
  const named = { ...of, identity: 'customer' }

  assert.equal(
    row(
      'store.orders.created',
      'store.orders',
      { id: 'e9', payload: { customer: 'a1b2' } },
      named
    ).identity,
    'a1b2'
  )
  assert.equal(
    row('store.orders.created', 'store.orders', { id: 'e10', payload: {} }, named)
      .identity,
    null
  )
})

it('should write what the contract declares of the payload', () => {
  const written = row(
    'store.orders.created',
    'store.orders',
    {
      id: 'e11',
      payload: { id: 'b5c8', VERSION: 1, total: 120, email: 'bob@example.com' }
    },
    of
  )

  assert.deepEqual(written.payload, { total: 120 })
})

it('should refuse a payload the contract does not admit, as permanent', () => {
  assert.throws(
    () =>
      row(
        'store.orders.created',
        'store.orders',
        { id: 'e12', payload: { total: 'a' } },
        of
      ),
    (error: any) =>
      error.code === exceptions.codes.EntityContract && exceptions.permanent(error)
  )
})

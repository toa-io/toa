import { it } from 'node:test'
import assert from 'node:assert/strict'

import { exceptions } from '@toa.io/core'
import { row, state } from './Recorder.ts'

it('should say which record changed, its version and when, as the payload says', () => {
  const written = row('store.orders.snapshot', 'store.orders', {
    id: 'e1',
    payload: { id: 'b5c8', VERSION: 3, UPDATED: 1761200000000, total: 120 },
    telemetry: '00-abc-def-01'
  })

  assert.equal(written.id, 'e1')
  assert.equal(written.entity, 'b5c8')
  assert.equal(written.version, 3)
  assert.equal(written.time, 1761200000000)
  assert.equal(written.trace, '00-abc-def-01')
})

it('should keep a payload that says none of it, and write when it arrived', () => {
  const before = Date.now()
  const written = row('store.orders.paid', 'store.orders', {
    id: 'e2',
    payload: { total: 120 }
  })

  assert.equal(written.entity, null)
  assert.equal(written.version, null)
  assert.ok(written.time >= before)
  assert.deepEqual(written.payload, { total: 120 })
})

it('should name a message from outside Toa by what it says', () => {
  const one = row('store.orders.paid', 'store.orders', { payload: { total: 1 } })
  const same = row('store.orders.paid', 'store.orders', { payload: { total: 1 } })

  assert.equal(one.id, same.id)
})

it('should keep an entity as its state renders it', () => {
  const kept = state('store.orders.sync', 'store.orders', {
    id: 'e3',
    payload: { id: 'b5c8', VERSION: 4, UPDATED: 1761200000000, total: 140 }
  })

  assert.equal(kept.component, 'store.orders')
  assert.equal(kept.entity, 'b5c8')
  assert.equal(kept.version, 4)
  assert.equal(kept.time, 1761200000000)
})

it('should refuse a state that does not say which entity and version it is, as permanent', () => {
  assert.throws(
    () =>
      state('store.orders.snapshot', 'store.orders', { id: 'e4', payload: { total: 1 } }),
    (error: any) =>
      error.code === exceptions.codes.EntityContract && exceptions.permanent(error)
  )
})

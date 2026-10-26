import { it } from 'node:test'
import assert from 'node:assert/strict'

import { expires, message } from './Publisher.ts'

it('should be a row of its scope, in the times the store reads', () => {
  const row = message(
    {
      id: 'e1',
      label: 'store.orders.paid',
      component: 'store.orders',
      time: Date.UTC(2026, 9, 25, 10, 0, 0, 5),
      entity: null,
      version: null,
      identity: null,
      trace: null,
      payload: { total: 1 }
    },
    'shop',
    '2027-10-25 10:00:00'
  )

  assert.equal(row.scope, 'shop')
  assert.equal(row.time, '2026-10-25 10:00:00.005')
  assert.equal(row.expires, '2027-10-25 10:00:00')
})

it("should say an encounter was received in the store's time", () => {
  const row = message(
    {
      id: 'c1',
      name: 'page_viewed',
      time: 0,
      received: Date.UTC(2026, 9, 25),
      visitor: null,
      session: null,
      identity: null,
      ip: null,
      country: null,
      origin: null,
      agent: null,
      browser: null,
      os: null,
      device: null,
      payload: {}
    },
    'shop',
    null
  )

  assert.equal(row.received, '2026-10-25 00:00:00.000')
  assert.ok(!('expires' in row))
})

it('should expire a row the retention after it, or never', () => {
  assert.equal(expires(Date.UTC(2026, 9, 25), 2), '2026-10-27 00:00:00')
  assert.equal(expires(Date.UTC(2026, 9, 25), undefined), '2106-01-01 00:00:00')
})

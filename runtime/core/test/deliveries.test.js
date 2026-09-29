import { it } from 'node:test'
import assert from 'node:assert/strict'

import * as deliveries from '../source/deliveries.js'

it('should settle at once where nothing is in flight', async () => {
  assert.equal(deliveries.inflight(), 0)

  await deliveries.settled()
})

it('should settle once the last delivery is done', async () => {
  deliveries.taken()
  deliveries.taken()

  let settled = false
  const waiting = deliveries.settled().then(() => (settled = true))

  deliveries.done()
  await Promise.resolve()

  assert.equal(settled, false, 'settled with a delivery still in flight')

  deliveries.done()
  await waiting

  assert.equal(settled, true)
})

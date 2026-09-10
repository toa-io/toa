import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Outbound } from '../source/outbound.js'

let comm, outbound

beforeEach(() => {
  comm = { route: mock.fn(async () => undefined), link: mock.fn() }
  outbound = new Outbound(comm, 'convergence')
})

it('should publish to the channel it was made for', async () => {
  await outbound.send('store.orders', { a: 1 })

  const [exchange] = comm.route.mock.calls[0].arguments

  assert.equal(exchange, 'convergence.out')
})

it('should address the message by its label', async () => {
  await outbound.send('store.orders', { a: 1 })

  const [, key] = comm.route.mock.calls[0].arguments

  assert.equal(key, 'store.orders')
})

it('should publish the message as it was handed it', async () => {
  const message = { record: { id: 'a1' }, trace: '00-abc' }

  await outbound.send('store.orders', message)

  const [, , published] = comm.route.mock.calls[0].arguments

  assert.strictEqual(published, message)
})

it('should publish persistent and mandatory', async () => {
  await outbound.send('store.orders', {})

  const [, , , properties] = comm.route.mock.calls[0].arguments

  assert.equal(properties.persistent, true)
  assert.equal(properties.mandatory, true)
})

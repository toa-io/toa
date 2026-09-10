import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Inbound } from '../source/inbound.js'

let comm, sink, inbound

beforeEach(() => {
  comm = {
    subscribe: mock.fn(async () => undefined),
    seal: mock.fn(async () => undefined),
    link: mock.fn()
  }

  sink = { accept: mock.fn(async () => undefined) }
  inbound = new Inbound(comm, 'convergence', 'store.orders', sink)
})

it('should bind its own queue to the channel under its label', async () => {
  await inbound.open()

  const [exchange, queue, key] = comm.subscribe.mock.calls[0].arguments

  assert.equal(exchange, 'convergence.in')
  assert.equal(queue, 'convergence.store.orders')
  assert.equal(key, 'store.orders')
})

it('should hand the message to the sink as it arrived', async () => {
  await inbound.open()

  const consumer = comm.subscribe.mock.calls[0].arguments[3]
  const message = { record: { id: 'a1' } }

  await consumer(message)

  assert.strictEqual(sink.accept.mock.calls[0].arguments[0], message)
})

it('should stop consuming and drain before it closes', async () => {
  let release
  const held = new Promise((resolve) => (release = resolve))

  sink.accept.mock.mockImplementation(async () => held)

  await inbound.open()

  const consumer = comm.subscribe.mock.calls[0].arguments[3]
  const delivery = consumer({})

  let closed = false

  const closing = inbound.close().then(() => (closed = true))

  await Promise.resolve()

  assert.equal(comm.seal.mock.callCount(), 1)
  assert.equal(closed, false, 'closed while a delivery was still running')

  release()
  await delivery
  await closing

  assert.equal(closed, true)
})

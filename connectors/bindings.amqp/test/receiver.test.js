import { describe, it, beforeEach, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { Connector } from '@toa.io/core'
import * as _communication from './communication.mock.js'
import * as _queues from './queues.mock.js'

const mock = {
  communication: _communication.communication,
  queues: _queues
}

mocking.module('../source/queues', { namedExports: mock.queues })

const { Receiver } = await import('../source/receiver.js')

it('should be', async () => {
  assert.notStrictEqual(Receiver, undefined)
})

/** @type {toa.amqp.Communication} */
const comm = mock.communication()

const exchange = generate()
const group = generate()

const processor = /** @type {toa.core.Receiver} */ {
  connect: mocking.fn(async () => undefined),
  disconnect: mocking.fn(async () => undefined),
  link: mocking.fn(),
  receive: mocking.fn(async () => undefined)
}

/** @type {Receiver} */
let receiver

beforeEach(() => {
  resetCalls()

  receiver = new Receiver(comm, exchange, group, processor)
})

it('should be instance of Connector', async () => {
  assert.ok(receiver instanceof Connector)
})

it('should depend on communication', async () => {
  assert.ok(comm.link.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], receiver)))
})

it('should consume events', async () => {
  await receiver.open()

  assert.ok(comm.consume.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], exchange) && isDeepStrictEqual(call.arguments[1], group) && typeof call.arguments[2] === 'function'))

  const callback = comm.consume.mock.calls[0].arguments[2]
  const payload = generate()
  const message = { payload }
  const properties = { headers: { 'toa.io/amqp': '0' } }

  await callback(message, properties)

  assert.ok(processor.receive.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], message)))
})

it('should consume foreign events', async () => {
  await receiver.open()

  assert.ok(comm.consume.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], exchange) && isDeepStrictEqual(call.arguments[1], group) && typeof call.arguments[2] === 'function'))

  const callback = comm.consume.mock.calls[0].arguments[2]
  const message = generate()
  const properties = { headers: {} }

  await callback(message, properties)

  assert.ok(processor.receive.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], { payload: message })))
})

describe('closing', () => {
  it('should stop consuming', async () => {
    await receiver.connect()
    await receiver.disconnect()

    assert.ok(comm.seal.mock.callCount() > 0)
  })

  // sealing cancels the consumer but does not recall what has already been dispatched,
  // and the receiver is torn down as soon as this connector is closed
  it('should wait for deliveries still running', async () => {
    let complete
    let closed = false

    processor.receive.mock.mockImplementationOnce(async () =>
      await new Promise((resolve) => { complete = resolve }))

    await receiver.connect()

    const callback = comm.consume.mock.calls[0].arguments[2]
    const delivery = callback({ payload: generate() }, { headers: { 'toa.io/amqp': '0' } })
    const closing = receiver.disconnect().then(() => { closed = true })

    await new Promise((resolve) => setImmediate(resolve))

    assert.strictEqual(closed, false)

    complete()

    await delivery
    await closing

    assert.strictEqual(closed, true)
  })

  it('should not be held by a delivery that failed', async () => {
    processor.receive.mock.mockImplementationOnce(async () => { throw new Error('nope') })

    await receiver.connect()

    const callback = comm.consume.mock.calls[0].arguments[2]

    await assert.rejects(callback({ payload: generate() }, { headers: { 'toa.io/amqp': '0' } }), (error) => /nope/.test(error.message))

    await assert.doesNotReject(receiver.disconnect())
  })
})

function resetCalls (target = [assert, mock, comm, exchange, group, processor], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

import { it, beforeEach, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

// region setup

import { generate } from 'randomstring'
import { Connector } from '@toa.io/core'
import * as _communication from './communication.mock.js'
import * as _queues from './queues.mock.js'

const mock = {
  communication: _communication.communication,
  queues: _queues
}

mocking.module('../source/queues', { namedExports: mock.queues })

const { Broadcast } = await import('../source/broadcast.js')

it('should be', async () => {
  assert.notStrictEqual(Broadcast, undefined)
})

const comm = mock.communication()
const locator = /** @type {toa.core.Locator} */ { namespace: generate(), name: generate() }
const group = generate()

/** @type {toa.core.bindings.Broadcast} */
let broadcast

beforeEach(() => {
  resetCalls()

  broadcast = new Broadcast(comm, locator, group)
})

// endregion

it('should be instance of Connector', async () => {
  assert.ok(broadcast instanceof Connector)
})

it('should depend on communication', async () => {
  assert.ok(comm.link.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], broadcast)))
})

it('should transmit', async () => {
  const label = generate()
  const message = generate()

  await broadcast.transmit(label, message)

  assert.ok(mock.queues.name.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], locator) && isDeepStrictEqual(call.arguments[1], label)))

  const exchange = mock.queues.name.mock.calls[0].result

  assert.ok(comm.emit.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], exchange) && isDeepStrictEqual(call.arguments[1], message) && isDeepStrictEqual(call.arguments[2], {
    'deliveryMode': 1
  })))
})

it('should receive', async () => {
  const label = generate()
  const process = mocking.fn(async () => undefined)

  await broadcast.receive(label, process)

  assert.ok(mock.queues.name.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], locator) && isDeepStrictEqual(call.arguments[1], label)))

  const exchange = mock.queues.name.mock.calls[0].result

  assert.ok(comm.consume.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], exchange) && isDeepStrictEqual(call.arguments[1], group) && typeof call.arguments[2] === 'function'))
})

it('should consume exclusively if group is not provided', async () => {
  resetCalls()

  broadcast = new Broadcast(comm, locator)

  const label = generate()
  const process = mocking.fn(async () => undefined)

  await broadcast.receive(label, process)

  const group = comm.consume.mock.calls[0].arguments[1]

  assert.strictEqual(group, undefined)
})

function resetCalls (target = [assert, mock, comm, locator, group], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

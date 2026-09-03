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

const { Emitter } = await import('../source/emitter.js')

it('should be', async () => {
  assert.notStrictEqual(Emitter, undefined)
})

const comm = mock.communication()
const locator = /** @type {toa.core.Locator} */ { name: generate(), namespace: generate() }
const label = generate()

/** @type {toa.core.bindings.Emitter} */
let emitter

beforeEach(() => {
  resetCalls()

  emitter = new Emitter(comm, locator, label)
})

// endregion

it('should be instance of Connector', async () => {
  assert.ok(emitter instanceof Connector)
})

it('should depend on communication', async () => {
  assert.ok(comm.link.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], emitter)))
})

it('should emit', async () => {
  const message = generate()

  await emitter.emit(message)

  assert.ok(mock.queues.name.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], locator) && isDeepStrictEqual(call.arguments[1], label)))

  const exchange = mock.queues.name.mock.calls[0].result
  const { arguments: args } = comm.emit.mock.calls[0]

  assert.deepStrictEqual(args[0], exchange)
  assert.deepStrictEqual(args[1], message)
})

it('should set authored header', async () => {
  const message = generate()

  await emitter.emit(message)

  assert.partialDeepStrictEqual(comm.emit.mock.calls[0].arguments[2], { headers: { 'toa.io/amqp': '0' } })
})

function resetCalls (target = [assert, mock, comm, locator, label], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

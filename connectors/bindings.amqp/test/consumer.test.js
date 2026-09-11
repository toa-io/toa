import { it, beforeEach, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { Unroutable } from 'comq'
import { Connector, exceptions } from '@toa.io/core'
import * as _communication from './communication.mock.js'
import * as _queues from './queues.mock.js'

const mock = {
  communication: _communication.communication,
  queues: _queues
}

mocking.module('../source/queues', { namedExports: mock.queues })

const { Consumer } = await import('../source/consumer.js')

it('should be', async () => {
  assert.notStrictEqual(Consumer, undefined)
})

const comm = mock.communication()
const locator = /** @type {import('@toa.io/core').Locator} */ {
  name: generate(),
  namespace: generate()
}
const endpoint = generate()

/** @type {import('@toa.io/core/types').bindings.Consumer} */
let consumer

beforeEach(() => {
  resetCalls()

  consumer = new Consumer(comm, locator, endpoint)
})

it('should be instance of Connector', async () => {
  assert.ok(consumer instanceof Connector)
})

it('should depend on communication', async () => {
  assert.ok(
    comm.link.mock.calls.some(
      (call) =>
        call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], consumer)
    )
  )
})

it('should send request', async () => {
  const request = generate()

  const reply = await consumer.request(request)

  assert.ok(
    mock.queues.name.mock.calls.some(
      (call) =>
        call.arguments.length === 2 &&
        isDeepStrictEqual(call.arguments[0], locator) &&
        isDeepStrictEqual(call.arguments[1], endpoint)
    )
  )

  const queue = mock.queues.name.mock.calls[0].result

  // a call that names no time to wait gives comq no options to wait by
  assert.ok(
    comm.request.mock.calls.some(
      (call) =>
        isDeepStrictEqual(call.arguments[0], queue) &&
        isDeepStrictEqual(call.arguments[1], request) &&
        call.arguments[2] === undefined
    )
  )
  assert.deepStrictEqual(reply, await comm.request.mock.calls[0].result)
})

function resetCalls(target = [assert, mock, comm, locator, endpoint], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

it('should send an addressed call under the name of the process it goes to', async () => {
  const request = generate()
  const instance = generate()

  const reply = await consumer.request(request, { instance })

  const exchange = mock.queues.instances.mock.calls[0].result

  assert.ok(
    comm.call.mock.calls.some(
      (call) =>
        call.arguments[0] === exchange &&
        call.arguments[1] === instance &&
        isDeepStrictEqual(call.arguments[2], request) &&
        call.arguments[3] === undefined
    )
  )
  assert.deepStrictEqual(reply, await comm.call.mock.calls[0].result)
})

it('should give comq the time a call waits', async () => {
  const signal = new AbortController().signal

  await consumer.request(generate(), { instance: generate(), timeout: 1000, signal })

  assert.deepStrictEqual(comm.call.mock.calls[0].arguments[3], { timeout: 1000, signal })
})

it('should answer an addressed call nobody holds as addressee', async () => {
  comm.call.mock.mockImplementationOnce(async () => {
    throw new Unroutable('exchange', 'key')
  })

  const reply = await consumer.request(generate(), { instance: generate() })

  assert.equal(reply.exception.code, exceptions.codes.Addressee)
})

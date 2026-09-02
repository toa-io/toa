'use strict'

const { it, beforeEach, mock: mocking } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')

const mock = {
  communication: require('./communication.mock').communication,
  queues: require('./queues.mock')
}

mocking.module('../source/queues', { namedExports: mock.queues })

const { Consumer } = require('../source/consumer')

it('should be', async () => {
  assert.notStrictEqual(Consumer, undefined)
})

const comm = mock.communication()
const locator = /** @type {toa.core.Locator} */ { name: generate(), namespace: generate() }
const endpoint = generate()

/** @type {toa.core.bindings.Consumer} */
let consumer

beforeEach(() => {
  resetCalls()

  consumer = new Consumer(comm, locator, endpoint)
})

it('should be instance of Connector', async () => {
  assert.ok(consumer instanceof Connector)
})

it('should depend on communication', async () => {
  assert.ok(comm.link.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], consumer)))
})

it('should send request', async () => {
  const request = generate()

  const reply = await consumer.request(request)

  assert.ok(mock.queues.name.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], locator) && isDeepStrictEqual(call.arguments[1], endpoint)))

  const queue = mock.queues.name.mock.calls[0].result

  assert.ok(comm.request.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], queue) && isDeepStrictEqual(call.arguments[1], request)))
  assert.deepStrictEqual(reply, await comm.request.mock.calls[0].result)
})

function resetCalls (target = [assert, mock, comm, locator, endpoint], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

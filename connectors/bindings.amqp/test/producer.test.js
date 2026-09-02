import { describe, it, beforeEach, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { each } from '@toa.io/generic'
import * as _communication from './communication.mock.js'
import * as _queues from './queues.mock.js'

const mock = {
  communication: _communication.communication,
  queues: _queues
}

mocking.module('../source/queues', { namedExports: mock.queues })

const { Producer } = await import('../source/producer.js')

it('should be', async () => {
  assert.notStrictEqual(Producer, undefined)
})

/** @type {toa.amqp.Communication} */
let comm

const locator = /** @type {toa.core.Locator} */ generate()
const endpoints = [generate(), generate()]

const component = /** @type {toa.core.Component} */ {
  connect: mocking.fn(async () => undefined),
  disconnect: mocking.fn(async () => undefined),
  link: mocking.fn(),
  invoke: mocking.fn(async () => generate())
}

/** @type {Producer} */
let producer

beforeEach(() => {
  resetCalls()

  comm = mock.communication()
  producer = new Producer(comm, locator, endpoints, component)
})

it('should depend on Communication', async () => {
  assert.ok(comm.link.mock.callCount() > 0)
})

it('should depend onComponent', async () => {
  assert.ok(component.link.mock.callCount() > 0)
})

it('should bind endpoints', async () => {
  await producer.connect()

  await each(endpoints, async (endpoint, i) => {
    const n = i + 1

    assert.ok(((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], locator) && isDeepStrictEqual(call.arguments[1], endpoint))(mock.queues.name.mock.calls[n - 1] ?? { arguments: [] }))

    const queue = mock.queues.name.mock.calls[i].result

    assert.ok(((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], queue) && typeof call.arguments[1] === 'function')(comm.reply.mock.calls[n - 1] ?? { arguments: [] }))

    const process = comm.reply.mock.calls[i].arguments[1]

    const request = generate()

    await process(request)

    assert.ok(((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], endpoint) && isDeepStrictEqual(call.arguments[1], request))(component.invoke.mock.calls[n - 1] ?? { arguments: [] }))
  })
})

it('should bind the tasks queue', async () => {
  await producer.connect()

  await each(endpoints, async (endpoint, i) => {
    const queue = mock.queues.name.mock.calls[i].result

    assert.ok(((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], queue + '..tasks') && typeof call.arguments[1] === 'function')(comm.process.mock.calls[i + 1 - 1] ?? { arguments: [] }))

    const process = comm.process.mock.calls[i].arguments[1]
    const request = generate()

    await process(request)

    assert.ok(component.invoke.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], endpoint) && isDeepStrictEqual(call.arguments[1], request)))
  })
})

describe('closing', () => {
  it('should stop consuming', async () => {
    await producer.connect()
    await producer.disconnect()

    assert.ok(comm.seal.mock.callCount() > 0)
  })

  // sealing cancels the consumer but does not recall what has already been dispatched,
  // and the component is torn down as soon as this connector is closed
  it('should wait for invocations still running', async () => {
    let complete
    let closed = false

    component.invoke.mock.mockImplementationOnce(async () =>
      await new Promise((resolve) => { complete = resolve }))

    await producer.connect()

    const process = comm.reply.mock.calls[0].arguments[1]
    const invocation = process(generate())
    const closing = producer.disconnect().then(() => { closed = true })

    await sleep()

    assert.strictEqual(closed, false)

    complete(generate())

    await invocation
    await closing

    assert.strictEqual(closed, true)
  })

  it('should not be held by an invocation that failed', async () => {
    component.invoke.mock.mockImplementationOnce(async () => { throw new Error('nope') })

    await producer.connect()

    const process = comm.reply.mock.calls[0].arguments[1]

    await assert.rejects(process(generate()), (error) => /nope/.test(error.message))
    await assert.doesNotReject(producer.disconnect())
  })
})

const sleep = async () => await new Promise((resolve) => setImmediate(resolve))

function resetCalls (target = [assert, mock, locator, endpoints, component, sleep], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

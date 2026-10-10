import { describe, it, beforeEach, afterEach, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { Unroutable } from 'comq'
import { Readable } from 'node:stream'
import { Connector, Encoded, exceptions } from '@toa.io/core'
import * as _communication from './communication.mock.js'
import * as _queues from './queues.mock.js'

const mock = {
  communication: _communication.communication,
  queues: _queues
}

mocking.module('../source/queues', { namedExports: mock.queues })

const { Consumer } = await import('../source/consumer.js')
const stopping = await import('../source/stopping.js')

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
    mock.queues.requests.mock.calls.some(
      (call) =>
        call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], locator)
    )
  )

  const queue = mock.queues.requests.mock.calls[0].result

  // an ordinary call waits for its reply, and gives comq nothing to wait by: the queue is the
  // component's, so what says which operation is the message
  assert.ok(
    comm.request.mock.calls.some(
      (call) =>
        call.arguments.length === 3 &&
        isDeepStrictEqual(call.arguments[0], queue) &&
        isDeepStrictEqual(call.arguments[1], request) &&
        isDeepStrictEqual(call.arguments[2], { headers: { 'toa.io/endpoint': endpoint } })
    )
  )
  assert.deepStrictEqual(reply, await comm.request.mock.calls[0].result)
})

describe('a call answered by a process that does not serve its operation', () => {
  const unserved = () => ({
    exception: { code: exceptions.codes.Unserved, message: generate() }
  })
  const ENDPOINT = exceptions.codes.Endpoint

  afterEach(() => {
    stopping.reset()
    mocking.timers.reset()
  })

  it('should be sent again, and answered by whichever serves it', async () => {
    const served = generate()

    comm.request.mock.mockImplementationOnce(async () => unserved(), 0)
    comm.request.mock.mockImplementationOnce(async () => unserved(), 1)
    comm.request.mock.mockImplementationOnce(async () => served, 2)

    const request = generate()
    const reply = await consumer.request(request)

    assert.strictEqual(reply, served)
    assert.strictEqual(comm.request.mock.callCount(), 3)

    for (const call of comm.request.mock.calls)
      assert.deepStrictEqual(call.arguments.slice(1), [
        request,
        { headers: { 'toa.io/endpoint': endpoint } }
      ])
  })

  it('should be answered with the exception once it has been sent again often enough', async () => {
    mocking.timers.enable({ apis: ['setTimeout'] })
    comm.request.mock.mockImplementation(async () => unserved())

    const replying = consumer.request(generate())

    // longer than every pause there is, one pause at a time, and more pauses than there are
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setImmediate(resolve))
      mocking.timers.tick(5 * 60 * 1000)
    }

    const reply = await replying

    comm.request.mock.mockImplementation(async () => generate())

    assert.strictEqual(reply.exception.code, ENDPOINT)
    assert.ok(reply.exception.message.includes(endpoint))
    assert.strictEqual(comm.request.mock.callCount(), 12)
  })

  it('should be answered with the exception at once where the process is stopping', async () => {
    comm.request.mock.mockImplementationOnce(async () => unserved(), 0)
    stopping.begin()

    const reply = await consumer.request(generate())

    assert.strictEqual(reply.exception.code, ENDPOINT)
    assert.strictEqual(comm.request.mock.callCount(), 1)
  })

  it('should stop waiting where the process begins to stop', async () => {
    comm.request.mock.mockImplementation(async () => unserved())

    const replying = consumer.request(generate())

    await new Promise((resolve) => setTimeout(resolve, 150))
    stopping.begin()

    const reply = await replying

    comm.request.mock.mockImplementation(async () => generate())

    assert.strictEqual(reply.exception.code, ENDPOINT)
  })
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

it('should hand over each value of a stream answering an encoded request as the bytes it is', async () => {
  comm.request.mock.mockImplementationOnce(async () =>
    Readable.from([Buffer.from('{"entry":1}'), { plain: true }])
  )

  const reply = await consumer.request({ encoded: true })
  const values = await reply.toArray()

  assert.ok(Encoded.is(values[0]))
  assert.deepStrictEqual(values[0].bytes, Buffer.from('{"entry":1}'))
  assert.deepStrictEqual(values[1], { plain: true })
})

it('should hand over a stream answering a request that asks for values as it is', async () => {
  const stream = Readable.from([Buffer.from('ab')])

  comm.request.mock.mockImplementationOnce(async () => stream)

  assert.strictEqual(await consumer.request({}), stream)
})

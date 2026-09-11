import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Call } from '../source/call.js'
import { codes } from '../source/exceptions.js'

const TARGET = 'default.streams.watch'

let transmission
let contract

beforeEach(() => {
  transmission = { request: mock.fn(async () => ({ output: 'ok' })), link: mock.fn() }
  contract = { fit: mock.fn(() => null) }

  delete process.env.TOA_ADDRESSED_TIMEOUT
})

afterEach(() => {
  delete process.env.TOA_ADDRESSED_TIMEOUT
})

const stateful = () => new Call(transmission, contract, TARGET, undefined, true)
const ordinary = () => new Call(transmission, contract, TARGET)

/** what the call handed the transmission to send */
const envelope = () => transmission.request.mock.calls.at(-1)?.arguments[0]

/** what the call handed the transmission beside it */
const terms = () => transmission.request.mock.calls.at(-1)?.arguments[1]

const pending = () => new Promise(() => undefined)

const refused = (message) => (exception) => {
  assert.equal(exception.code, codes.RequestContract)
  assert.match(exception.message, message)

  return true
}

it('should refuse a call to a stateful operation that names no process', async () => {
  await assert.rejects(stateful().invoke({ input: null }), refused(/names `instance`/))

  assert.equal(transmission.request.mock.callCount(), 0)
})

it('should refuse a call to an ordinary operation that names a process', async () => {
  await assert.rejects(
    ordinary().invoke({ input: null, instance: 'a' }),
    refused(/names no `instance`/)
  )

  assert.equal(transmission.request.mock.callCount(), 0)
})

// nobody waits for a task
it('should refuse a task that waits', async () => {
  await assert.rejects(ordinary().invoke({ task: true }, { timeout: 1000 }), refused(/task/))
  await assert.rejects(
    ordinary().invoke({ task: true }, { signal: new AbortController().signal }),
    refused(/task/)
  )
})

it('should refuse a timeout that is no positive number of milliseconds', async () => {
  for (const timeout of [0, -1, Infinity, Number.NaN])
    await assert.rejects(ordinary().invoke({}, { timeout }), refused(/`timeout`/))
})

it('should send neither the name nor the wait', async () => {
  const signal = new AbortController().signal

  await stateful().invoke({ input: 1, instance: 'a' }, { timeout: 1000, signal })

  for (const key of ['instance', 'timeout', 'signal']) assert.ok(!(key in envelope()), key)
})

it('should hand the transmission the process a call goes to', async () => {
  await stateful().invoke({ instance: 'a' })

  assert.equal(terms().instance, 'a')
})

it('should wait 5 seconds for an addressed call that sets no wait', async () => {
  await stateful().invoke({ instance: 'a' })

  assert.equal(terms().timeout, 5000)
  assert.ok(terms().signal instanceof AbortSignal)
})

it('should wait for an addressed call what the context sets', async () => {
  process.env.TOA_ADDRESSED_TIMEOUT = '1500'

  await stateful().invoke({ instance: 'a' })

  assert.equal(terms().timeout, 1500)
})

it('should wait what the caller sets in place of the default', async () => {
  await stateful().invoke({ instance: 'a' }, { timeout: 60000 })

  assert.equal(terms().timeout, 60000)
})

it('should set an ordinary call no wait of its own', async () => {
  await ordinary().invoke({})

  assert.equal(terms(), undefined)
})

it('should abandon a call its signal ends, with the reason as the cause', async () => {
  transmission.request = mock.fn(pending)

  const controller = new AbortController()
  const reason = new Error('client gone')
  const promise = ordinary().invoke({}, { signal: controller.signal })

  controller.abort(reason)

  await assert.rejects(promise, (exception) => {
    assert.equal(exception.code, codes.Abandoned)
    assert.equal(exception.cause, reason)

    return true
  })
})

it('should abandon an addressed call at its deadline', async () => {
  transmission.request = mock.fn(pending)

  await assert.rejects(
    stateful().invoke({ instance: 'a' }, { timeout: 20 }),
    (exception) => exception.code === codes.Abandoned
  )
})

it('should end the wait on the signal within the deadline', async () => {
  transmission.request = mock.fn(pending)

  const signal = new AbortController().signal

  await assert.rejects(
    stateful().invoke({ instance: 'a' }, { timeout: 20, signal }),
    (exception) => exception.code === codes.Abandoned
  )
})

it('should answer with a reply that arrives in time', async () => {
  assert.equal(await stateful().invoke({ instance: 'a' }, { timeout: 1000 }), 'ok')
})

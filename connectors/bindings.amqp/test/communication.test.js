import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

const comq = { assert: mock.fn() }

mock.module('comq', { namedExports: comq })

/** @type {comq.IO} */
let io

/** @type {typeof import('../source/communication.js').Communication} */
let Communication

beforeEach(async () => {
  io = {
    diagnose: mock.fn(),
    seal: mock.fn(),
    close: mock.fn(),
    reply: mock.fn(),
    request: mock.fn(),
    emit: mock.fn(),
    consume: mock.fn(),
    process: mock.fn(),
    enqueue: mock.fn()
  }

  comq.assert.mock.mockImplementation(async () => io)

  // the connector diagnoses a set of brokers once per process, and a module is
  // evaluated once per specifier, so each scenario asks for a distinct one
  ;({ Communication } = await import('../source/communication.js?' + Math.random()))
})

/**
 * @param {string[]} references
 * @param {() => void} [evict]
 */
function communication (references, evict) {
  return new Communication(references, evict)
}

/**
 * @param {string[]} references
 */
async function connect (references) {
  const instance = communication(references)

  await instance.connect()

  return instance
}

it('should diagnose the connection', async () => {
  await connect(['amqp://broker'])

  const events = io.diagnose.mock.calls.map(({ arguments: [event] }) => event)

  assert.ok(events.includes('close'))
  assert.ok(events.includes('return'))
  assert.ok(events.includes('error'))
  assert.ok(events.includes('lost'))
  assert.ok(events.includes('reconnect'))
  assert.ok(events.includes('exhausted'))
})

it('should diagnose the shared connection once', async () => {
  const references = ['amqp://one', 'amqp://another']

  await connect(references)

  const once = io.diagnose.mock.calls.length

  await connect(references)
  await connect(references)

  assert.strictEqual(io.diagnose.mock.callCount(), once)
})

it('should diagnose each set of brokers', async () => {
  await connect(['amqp://one'])

  const once = io.diagnose.mock.calls.length

  await connect(['amqp://another'])

  assert.strictEqual(io.diagnose.mock.callCount(), once * 2)
})

// otherwise a set of brokers goes unreported for the rest of the process
it('should hand the diagnosing over when the one doing it goes', async () => {
  const references = ['amqp://broker']
  const first = await connect(references)
  const once = io.diagnose.mock.calls.length

  await first.disconnect()
  await connect(references)

  assert.strictEqual(io.diagnose.mock.callCount(), once * 2)
})

describe('sealing', () => {
  it('should refuse to consume once sealed', async () => {
    const instance = await connect(['amqp://broker'])

    await instance.seal()

    assert.strictEqual(instance.sealed, true)

    await assert.rejects(instance.reply('queue', () => undefined), (error) => /sealed/.test(error.message))
    await assert.rejects(instance.process('queue', () => undefined), (error) => /sealed/.test(error.message))
    await assert.rejects(instance.consume('exchange', 'group', () => undefined), (error) => /sealed/.test(error.message))
  })

  // sealing stops consuming, not publishing
  it('should keep publishing once sealed', async () => {
    const instance = await connect(['amqp://broker'])

    await instance.seal()

    await assert.doesNotReject(instance.emit('exchange', 'message'))
    await assert.doesNotReject(instance.enqueue('queue', 'message'))
    await assert.doesNotReject(instance.request('queue', 'request'))
  })
})

it('should tell whoever holds it that it is going', async () => {
  const evict = mock.fn()
  const instance = communication(['amqp://broker'], evict)

  await instance.connect()
  await instance.disconnect()

  assert.ok(evict.mock.callCount() > 0)
})

'use strict'

jest.mock('comq', () => ({ assert: jest.fn() }))

/** @type {jest.MockedObject<comq.IO>} */
let io

beforeEach(() => {
  // the connector diagnoses a set of brokers once per process
  jest.resetModules()

  io = {
    diagnose: jest.fn(),
    seal: jest.fn(),
    close: jest.fn(),
    reply: jest.fn(),
    request: jest.fn(),
    emit: jest.fn(),
    consume: jest.fn(),
    process: jest.fn(),
    enqueue: jest.fn()
  }

  require('comq').assert.mockResolvedValue(io)
})

/**
 * @param {string[]} references
 * @param {() => void} [evict]
 */
function communication (references, evict) {
  const { Communication } = require('../source/communication')

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

  const events = io.diagnose.mock.calls.map(([event]) => event)

  expect(events).toContain('close')
  expect(events).toContain('return')
  expect(events).toContain('error')
  expect(events).toContain('lost')
  expect(events).toContain('reconnect')
  expect(events).toContain('exhausted')
})

it('should diagnose the shared connection once', async () => {
  const references = ['amqp://one', 'amqp://another']

  await connect(references)

  const once = io.diagnose.mock.calls.length

  await connect(references)
  await connect(references)

  expect(io.diagnose).toHaveBeenCalledTimes(once)
})

it('should diagnose each set of brokers', async () => {
  await connect(['amqp://one'])

  const once = io.diagnose.mock.calls.length

  await connect(['amqp://another'])

  expect(io.diagnose).toHaveBeenCalledTimes(once * 2)
})

// otherwise a set of brokers goes unreported for the rest of the process
it('should hand the diagnosing over when the one doing it goes', async () => {
  const references = ['amqp://broker']
  const first = await connect(references)
  const once = io.diagnose.mock.calls.length

  await first.disconnect()
  await connect(references)

  expect(io.diagnose).toHaveBeenCalledTimes(once * 2)
})

describe('sealing', () => {
  it('should refuse to consume once sealed', async () => {
    const instance = await connect(['amqp://broker'])

    await instance.seal()

    expect(instance.sealed).toBe(true)

    await expect(instance.reply('queue', () => undefined)).rejects.toThrow(/sealed/)
    await expect(instance.process('queue', () => undefined)).rejects.toThrow(/sealed/)
    await expect(instance.consume('exchange', 'group', () => undefined)).rejects.toThrow(/sealed/)
  })

  // sealing stops consuming, not publishing
  it('should keep publishing once sealed', async () => {
    const instance = await connect(['amqp://broker'])

    await instance.seal()

    await expect(instance.emit('exchange', 'message')).resolves.not.toThrow()
    await expect(instance.enqueue('queue', 'message')).resolves.not.toThrow()
    await expect(instance.request('queue', 'request')).resolves.not.toThrow()
  })
})

it('should tell whoever holds it that it is going', async () => {
  const evict = jest.fn()
  const instance = communication(['amqp://broker'], evict)

  await instance.connect()
  await instance.disconnect()

  expect(evict).toHaveBeenCalled()
})

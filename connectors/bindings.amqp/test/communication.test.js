'use strict'

jest.mock('comq', () => ({ assert: jest.fn() }))

/** @type {jest.MockedObject<comq.IO>} */
let io

beforeEach(() => {
  // the connector diagnoses a set of brokers once per process
  jest.resetModules()

  io = { diagnose: jest.fn(), seal: jest.fn(), close: jest.fn() }
  require('comq').assert.mockResolvedValue(io)
})

/**
 * @param {string[]} references
 * @returns {Promise<void>}
 */
async function connect (references) {
  const { Communication } = require('../source/communication')
  const communication = new Communication(async () => references)

  await communication.connect()
}

it('should diagnose the connection', async () => {
  await connect(['amqp://broker'])

  const events = io.diagnose.mock.calls.map(([event]) => event)

  expect(events).toContain('close')
  expect(events).toContain('return')
  expect(events).toContain('error')
  expect(events).toContain('lost')
  expect(events).toContain('reconnect')
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

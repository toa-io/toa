'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')

const mock = {
  communication: require('./communication.mock').communication,
  queues: require('./queues.mock')
}

jest.mock('../source/queues', () => mock.queues)

const { Receiver } = require('../source/receiver')

it('should be', async () => {
  expect(Receiver).toBeDefined()
})

/** @type {jest.MockedObject<toa.amqp.Communication>} */
const comm = mock.communication()

const exchange = generate()
const group = generate()

const processor = /** @type {jest.MockedObject<toa.core.Receiver>} */ {
  connect: jest.fn(async () => undefined),
  disconnect: jest.fn(async () => undefined),
  link: jest.fn(),
  receive: jest.fn(async () => undefined)
}

/** @type {Receiver} */
let receiver

beforeEach(() => {
  jest.clearAllMocks()

  receiver = new Receiver(comm, exchange, group, processor)
})

it('should be instance of Connector', async () => {
  expect(receiver).toBeInstanceOf(Connector)
})

it('should depend on communication', async () => {
  expect(comm.link).toHaveBeenCalledWith(receiver)
})

it('should consume events', async () => {
  await receiver.open()

  expect(comm.consume).toHaveBeenCalledWith(exchange, group, expect.any(Function))

  const callback = comm.consume.mock.calls[0][2]
  const payload = generate()
  const message = { payload }
  const properties = { headers: { 'toa.io/amqp': '0' } }

  await callback(message, properties)

  expect(processor.receive).toHaveBeenCalledWith(message)
})

it('should consume foreign events', async () => {
  await receiver.open()

  expect(comm.consume).toHaveBeenCalledWith(exchange, group, expect.any(Function))

  const callback = comm.consume.mock.calls[0][2]
  const message = generate()
  const properties = { headers: {} }

  await callback(message, properties)

  expect(processor.receive).toHaveBeenCalledWith({ payload: message })
})

describe('closing', () => {
  it('should stop consuming', async () => {
    await receiver.connect()
    await receiver.disconnect()

    expect(comm.seal).toHaveBeenCalled()
  })

  // sealing cancels the consumer but does not recall what has already been dispatched,
  // and the receiver is torn down as soon as this connector is closed
  it('should wait for deliveries still running', async () => {
    let complete
    let closed = false

    processor.receive.mockImplementationOnce(async () =>
      await new Promise((resolve) => { complete = resolve }))

    await receiver.connect()

    const callback = comm.consume.mock.calls[0][2]
    const delivery = callback({ payload: generate() }, { headers: { 'toa.io/amqp': '0' } })
    const closing = receiver.disconnect().then(() => { closed = true })

    await new Promise((resolve) => setImmediate(resolve))

    expect(closed).toBe(false)

    complete()

    await delivery
    await closing

    expect(closed).toBe(true)
  })

  it('should not be held by a delivery that failed', async () => {
    processor.receive.mockImplementationOnce(async () => { throw new Error('nope') })

    await receiver.connect()

    const callback = comm.consume.mock.calls[0][2]

    await expect(callback({ payload: generate() }, { headers: { 'toa.io/amqp': '0' } }))
      .rejects.toThrow('nope')

    await expect(receiver.disconnect()).resolves.not.toThrow()
  })
})

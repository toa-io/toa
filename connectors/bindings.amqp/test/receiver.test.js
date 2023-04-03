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
  const message = generate()

  await callback(message)

  expect(processor.receive).toHaveBeenCalledWith(message)
})

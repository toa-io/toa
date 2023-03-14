'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')

const mock = {
  communication: require('./communication.mock').communication,
  queues: require('./queues.mock')
}

jest.mock('../source/queues', () => mock.queues)

const { Consumer } = require('../source/consumer')

it('should be', async () => {
  expect(Consumer).toBeDefined()
})

const comm = mock.communication()
const locator = /** @type {toa.core.Locator} */ { name: generate(), namespace: generate() }
const endpoint = generate()

/** @type {toa.core.bindings.Consumer} */
let consumer

beforeEach(() => {
  jest.clearAllMocks()

  consumer = new Consumer(comm, locator, endpoint)
})

it('should be instance of Connector', async () => {
  expect(consumer).toBeInstanceOf(Connector)
})

it('should depend on communication', async () => {
  expect(comm.link).toHaveBeenCalledWith(consumer)
})

it('should send request', async () => {
  const request = generate()

  const reply = await consumer.request(request)

  expect(mock.queues.name).toHaveBeenCalledWith(locator, endpoint)

  const queue = mock.queues.name.mock.results[0].value

  expect(comm.request).toHaveBeenCalledWith(queue, request)
  expect(reply).toStrictEqual(await comm.request.mock.results[0].value)
})

'use strict'

// region setup

const { Connector } = require('@toa.io/core')

const mock = {
  communication: require('./communication.mock').communication,
  queues: require('./queues.mock')
}

jest.mock('../source/queues', () => mock.queues)

const { Broadcast } = require('../source/broadcast')
const { Emitter } = require('../source/emitter')
const { generate } = require('randomstring')

it('should be', async () => {
  expect(Broadcast).toBeDefined()
})

const comm = mock.communication()
const locator = /** @type {toa.core.Locator} */ { namespace: generate(), name: generate() }
const group = generate()

/** @type {toa.core.bindings.Broadcast} */
let broadcast

beforeEach(() => {
  jest.clearAllMocks()

  broadcast = new Broadcast(comm, locator, group)
})

// endregion

it('should be instance of Connector', async () => {
  expect(broadcast).toBeInstanceOf(Connector)
})

it('should depend on communication', async () => {
  expect(comm.link).toHaveBeenCalledWith(broadcast)
})

it('should transmit', async () => {
  const label = generate()
  const message = generate()

  await broadcast.transmit(label, message)

  expect(mock.queues.name).toHaveBeenCalledWith(locator, label)

  const exchange = mock.queues.name.mock.results[0].value

  expect(comm.emit).toHaveBeenCalledWith(exchange, message)
})

it('should receive', async () => {
  const label = generate()
  const process = jest.fn(async () => undefined)

  await broadcast.receive(label, process)

  expect(mock.queues.name).toHaveBeenCalledWith(locator, label)

  const exchange = mock.queues.name.mock.results[0].value

  expect(comm.consume).toHaveBeenCalledWith(exchange, group, expect.any(Function))
})

it('should create unique group if not provided', async () => {
  jest.clearAllMocks()

  broadcast = new Broadcast(comm, locator)

  const label = generate()
  const process = jest.fn(async () => undefined)

  await broadcast.receive(label, process)

  const group = comm.consume.mock.calls[0][1]
  
  expect(group).toBeDefined()
})

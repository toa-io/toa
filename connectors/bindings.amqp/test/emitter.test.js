'use strict'

// region setup

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')

const mock = {
  communication: require('./communication.mock').communication,
  queues: require('./queues.mock')
}

jest.mock('../source/queues', () => mock.queues)

const { Emitter } = require('../source/emitter')

it('should be', async () => {
  expect(Emitter).toBeDefined()
})

const comm = mock.communication()
const locator = /** @type {toa.core.Locator} */ { name: generate(), namespace: generate() }
const label = generate()

/** @type {toa.core.bindings.Emitter} */
let emitter

beforeEach(() => {
  jest.clearAllMocks()

  emitter = new Emitter(comm, locator, label)
})

// endregion

it('should be instance of Connector', async () => {
  expect(emitter).toBeInstanceOf(Connector)
})

it('should depend on communication', async () => {
  expect(comm.link).toHaveBeenCalledWith(emitter)
})

it('should emit', async () => {
  const message = generate()

  await emitter.emit(message)

  expect(mock.queues.name).toHaveBeenCalledWith(locator, label)

  const exchange = mock.queues.name.mock.results[0].value

  expect(comm.emit).toHaveBeenCalledWith(exchange, message)
})

'use strict'

const { generate } = require('randomstring')
const { Locator, Connector } = require('@toa.io/core')

const fixtures = require('./receiver.fixtures')
const { binding, Factory } = require('../../src/binding')

const factory = new Factory()

it('should expose receivers factory', async () => {
  expect(factory.receiver).toBeDefined()
})

/** @type {toa.core.Connector} */
let receiver

/** @type {toa.core.Locator} */
let locator

/** @type {string} */
let label

const group = generate()
const endpoint = generate()

beforeEach(async () => {
  jest.clearAllMocks()
  binding.reset()

  const namespace = generate()
  const name = generate()

  locator = new Locator(name, namespace)
  label = locator.id + '.' + endpoint
  receiver = factory.receiver(locator, label, group, fixtures.receiver)

  await receiver.connect()
})

it('should return connector', async () => {
  expect(receiver).toBeInstanceOf(Connector)
})

it('should call receiver', async () => {
  const payload = { [generate()]: generate() }

  /** @type {toa.core.Message} */
  const message = { payload }

  await binding.emit(label, message)

  expect(fixtures.receiver.receive).toHaveBeenCalledWith(message)
})

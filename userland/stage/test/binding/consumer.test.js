'use strict'

const { generate } = require('randomstring')
const { Connector, Locator } = require('@toa.io/core')

const { binding, Factory } = require('../../src/binding')

const factory = new Factory()

it('should expose consumers factory', async () => {
  expect(factory.consumer).toBeDefined()
})

/** @type {toa.core.bindings.Consumer} */
let consumer

/** @type {toa.core.Locator} */
let locator

/** @type {string} */
let label

const endpoint = generate()

beforeEach(() => {
  jest.clearAllMocks()
  binding.reset()

  const namespace = generate()
  const name = generate()

  locator = new Locator(name, namespace)
  label = locator.id + '.' + endpoint
  consumer = factory.consumer(locator, endpoint)
})

it('should return Connector', async () => {
  expect(consumer).toBeInstanceOf(Connector)
})

it('should return reply', async () => {
  const request = generate()
  const reply = generate()
  const call = jest.fn(async () => reply)

  await binding.reply(label, call)

  const received = await consumer.request(request)

  expect(call).toHaveBeenCalledWith(request)
  expect(received).toStrictEqual(reply)
})

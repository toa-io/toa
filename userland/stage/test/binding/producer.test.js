'use strict'

const { generate } = require('randomstring')
const { Locator, Connector } = require('@toa.io/core')
const { sample } = require('@toa.io/libraries/generic')

const fixtures = require('./producer.fixtures')
const { binding, Factory } = require('../../src/binding')

const factory = new Factory()

it('should expose producers factory', async () => {
  expect(factory.producer).toBeDefined()
})

/** @type {toa.core.Connector} */
let producer

/** @type {toa.core.Locator} */
let locator

beforeEach(async () => {
  jest.clearAllMocks()
  binding.reset()

  const namespace = generate()
  const name = generate()

  locator = new Locator(name, namespace)
  producer = factory.producer(locator, fixtures.endpoints, fixtures.producer)

  await producer.connect()
})

it('should return Connector', async () => {
  expect(producer).toBeInstanceOf(Connector)
})

it('should return result', async () => {
  const endpoint = sample(fixtures.endpoints)
  const label = locator.id + '.' + endpoint
  const request = { [generate()]: generate() }

  const reply = await binding.request(label, request)

  expect(fixtures.producer.invoke).toHaveBeenCalledWith(endpoint, request)

  expect(reply).toStrictEqual(await fixtures.producer.invoke.mock.results[0].value)
})

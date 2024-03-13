'use strict'

const { generate } = require('randomstring')
const {
  Locator,
  Connector
} = require('@toa.io/core')

const {
  binding,
  Factory
} = require('../../src/binding')

const factory = new Factory()

it('should expose emitters factory', async () => {
  expect(factory.emitter).toBeDefined()
})

/** @type {toa.core.bindings.Emitter} */
let emitter

/** @type {string} */
let label

/** @type {toa.core.Locator} */
let locator

const endpoint = generate()

beforeEach(() => {
  jest.clearAllMocks()
  binding.reset()

  const namespace = generate()
  const name = generate()

  locator = new Locator(name, namespace)
  label = locator.id + '.' + endpoint
  emitter = factory.emitter(locator, endpoint)
})

it('should return Connector', async () => {
  expect(emitter).toBeInstanceOf(Connector)
})

it('should call receiver', async () => {
  const callback = jest.fn(async () => undefined)

  await binding.subscribe(label, callback)

  const payload = { [generate()]: generate() }

  /** @type {toa.core.Message} */
  const message = { payload }

  await emitter.emit(message)

  expect(callback).toHaveBeenCalledWith(message)
})

it('should not modify message', async () => {
  const callback = jest.fn((payload) => {
    payload.payload.foo = 'bar'
  })

  await binding.subscribe(label, callback)

  const payload = { [generate()]: generate() }

  /** @type {toa.core.Message} */
  const message = { payload }
  const origin = JSON.parse(JSON.stringify(message))

  await emitter.emit(message)

  expect(origin).toEqual(message)
})

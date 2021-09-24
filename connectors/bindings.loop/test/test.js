'use strict'

const clone = require('clone-deep')

const { Factory } = require('../src/factory')
const fixtures = require('./fixtures')

const factory = new Factory()
const producer = factory.producer(fixtures.runtime.locator, fixtures.endpoints, fixtures.runtime)
const consumer = factory.consumer(fixtures.runtime.locator)

beforeAll(async () => {
  await producer.connect()
  await consumer.connect()
})

afterAll(async () => {
  await producer.disconnect()
  await consumer.disconnect()
})

beforeEach(() => {
  jest.clearAllMocks()
})

it('should bind', async () => {
  const r1 = await consumer.request('add', 1)
  const r2 = await consumer.request('get', 2)

  expect(fixtures.runtime.invoke).toHaveBeenCalledTimes(2)
  expect(fixtures.runtime.invoke).toHaveBeenNthCalledWith(1, 'add', 1)
  expect(fixtures.runtime.invoke).toHaveBeenNthCalledWith(2, 'get', 2)

  expect(r1).toBe(await fixtures.runtime.invoke.mock.results[0].value)
  expect(r2).toBe(await fixtures.runtime.invoke.mock.results[1].value)
})

it('should return false if no operation bound', async () => {
  const result = await consumer.request('oops')

  expect(result).toBe(false)
})

it('should return false if no binding', async () => {
  const consumer = factory.consumer({ fqn: 'not.existent' })
  const result = await consumer.request('get')

  expect(result).toBe(false)
})

it('should not depend on initialization order', async () => {
  const runtime = clone(fixtures.runtime)
  runtime.locator.fqn = 'other.name'

  const consumer = factory.consumer(runtime.locator)
  await consumer.connect()

  expect(await consumer.request('get')).toBe(false)

  const producer = factory.producer(runtime.locator, fixtures.endpoints, runtime)
  await producer.connect()

  expect(await consumer.request('get')).toBe(await runtime.invoke.mock.results[0].value)
})

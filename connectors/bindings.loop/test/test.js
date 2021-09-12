'use strict'

const clone = require('clone-deep')

const { Factory } = require('../src/factory')
const fixtures = require('./fixtures')

const factory = new Factory()
const producer = factory.producer(fixtures.runtime, fixtures.endpoints)
const consumer = factory.consumer(fixtures.runtime.locator)
const exposition = factory.exposition(fixtures.exposition, ['discover'])
const discovery = factory.discovery(fixtures.exposition.locator)

beforeAll(async () => {
  await producer.connect()
  await consumer.connect()
  await exposition.connect()
  await discovery.connect()
})

beforeEach(() => {
  jest.clearAllMocks()
})

it('should bind', async () => {
  const r1 = await consumer.request('add', 1, 2)
  const r2 = await consumer.request('get', 3, 4)

  expect(fixtures.runtime.invoke).toHaveBeenCalledTimes(2)
  expect(fixtures.runtime.invoke).toHaveBeenNthCalledWith(1, 'add', 1, 2)
  expect(fixtures.runtime.invoke).toHaveBeenNthCalledWith(2, 'get', 3, 4)

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

  const producer = factory.producer(runtime, fixtures.endpoints)
  await producer.connect()

  expect(await consumer.request('get')).toBe(await runtime.invoke.mock.results[0].value)
})

it('should share bindings among instances', async () => {
  const factory = new Factory()
  const consumer = factory.consumer(fixtures.runtime.locator)

  await consumer.connect()

  const result = await consumer.request('get', 1, 2)

  expect(fixtures.runtime.invoke).toHaveBeenCalledTimes(1)
  expect(fixtures.runtime.invoke).toHaveBeenNthCalledWith(1, 'get', 1, 2)
  expect(await fixtures.runtime.invoke.mock.results[0].value).toBe(result)
})

it('should expose', async () => {
  const result = await discovery.request('discover')

  expect(result).toBe(await fixtures.exposition.invoke.mock.results[0].value)
})

it('should not intersect with operations', async () => {
  await discovery.request('discover')

  expect(fixtures.runtime.invoke).not.toHaveBeenCalled()
})

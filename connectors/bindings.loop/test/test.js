'use strict'

const clone = require('clone-deep')
const { sample } = require('@toa.io/generic')

const { Factory } = require('../src/factory')
const fixtures = require('./fixtures')

const factory = new Factory()
const producer = factory.producer(fixtures.component.locator, fixtures.endpoints, fixtures.component)

let consumer, endpoint

beforeAll(async () => {
  await producer.connect()
})

afterAll(async () => {
  await producer.disconnect()
})

beforeEach(async () => {
  jest.clearAllMocks()

  endpoint = sample(fixtures.endpoints)
  consumer = factory.consumer(fixtures.component.locator, endpoint)

  await consumer.connect()
})

afterEach(async () => {
  await consumer.disconnect()
})

it('should bind', async () => {
  const r1 = await consumer.request(1)
  const r2 = await consumer.request(2)

  expect(fixtures.component.invoke).toHaveBeenCalledTimes(2)
  expect(fixtures.component.invoke).toHaveBeenNthCalledWith(1, endpoint, 1)
  expect(fixtures.component.invoke).toHaveBeenNthCalledWith(2, endpoint, 2)

  expect(r1).toBe(await fixtures.component.invoke.mock.results[0].value)
  expect(r2).toBe(await fixtures.component.invoke.mock.results[1].value)
})

it('should return false if no binding', async () => {
  const consumer = factory.consumer({ id: 'not.existent' }, endpoint)
  const result = await consumer.request()

  expect(result).toBe(false)
})

it('should not depend on initialization order', async () => {
  const component = clone(fixtures.component)

  component.locator.id = 'other.name'

  const consumer = factory.consumer(component.locator, endpoint)
  await consumer.connect()

  expect(await consumer.request()).toBe(false)

  const producer = factory.producer(component.locator, fixtures.endpoints, component)
  await producer.connect()

  expect(await consumer.request()).toBe(await component.invoke.mock.results[0].value)
})

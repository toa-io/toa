import { it, before, after, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'
import { sample } from '@toa.io/generic'

import { Factory } from '../src/factory.js'
import * as fixtures from './fixtures.js'

const factory = new Factory()
const producer = factory.producer(fixtures.component.locator, fixtures.endpoints, fixtures.component)

let consumer, endpoint

before(async () => {
  await producer.connect()
})

after(async () => {
  await producer.disconnect()
})

beforeEach(async () => {
  resetCalls()

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

  const calls = fixtures.component.invoke.mock.calls

  assert.strictEqual(calls.length, 2)
  assert.deepStrictEqual(calls[0].arguments, [endpoint, 1])
  assert.deepStrictEqual(calls[1].arguments, [endpoint, 2])

  assert.strictEqual(r1, await calls[0].result)
  assert.strictEqual(r2, await calls[1].result)
})

it('should return false if no binding', async () => {
  const consumer = factory.consumer({ id: 'not.existent' }, endpoint)
  const result = await consumer.request()

  assert.strictEqual(result, false)
})

it('should not depend on initialization order', async () => {
  const component = clone(fixtures.component)

  component.locator.id = 'other.name'

  const consumer = factory.consumer(component.locator, endpoint)
  await consumer.connect()

  assert.strictEqual(await consumer.request(), false)

  const producer = factory.producer(component.locator, fixtures.endpoints, component)
  await producer.connect()

  assert.strictEqual(await consumer.request(), await component.invoke.mock.calls[0].result)
})

function resetCalls (target = [fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

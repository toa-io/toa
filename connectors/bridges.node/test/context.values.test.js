import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Context } from '../src/context.js'

// taken from the component context, so that what wraps it answers them as it answers a call
const component = {
  newid: mock.fn(() => 'a1b2c3d4e5f60718293a4b5c6d7e8f90'),
  now: mock.fn(() => 1700000000000),
  random: mock.fn(() => 0.25),
  apply: mock.fn(),
  call: mock.fn(),
  aspects: [],
  link: mock.fn(),
  connect: mock.fn()
}

let context

beforeEach(async () => {
  context = new Context(component)

  await context.connect()
})

it('should answer an id from the component context', () => {
  assert.equal(context.id(), 'a1b2c3d4e5f60718293a4b5c6d7e8f90')
})

it('should answer the time from the component context', () => {
  assert.equal(context.now(), 1700000000000)
})

it('should answer a random number from the component context', () => {
  assert.equal(context.random(), 0.25)
})

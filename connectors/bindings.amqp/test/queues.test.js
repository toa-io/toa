import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'

import { bound, inbound, name, outbound } from '../source/queues.js'
import {
  queue,
  CHANNEL,
  INBOUND,
  OUTBOUND
} from '@toa.io/definitions/extensions.convergence'

/** @type {import('@toa.io/core').Locator} */
let locator

const endpoint = generate()

beforeEach(() => {
  locator = /** @type {import('@toa.io/core').Locator} */ {
    name: generate(),
    namespace: generate()
  }
})

it('should be', async () => {
  assert.ok(name instanceof Function)
})

it('should name a queue', async () => {
  const queue = name(locator, endpoint)

  assert.deepStrictEqual(queue, `${locator.namespace}.${locator.name}.${endpoint}`)
})

it('should name a queue with nameless locator', async () => {
  delete locator.name

  const queue = name(locator, endpoint)

  assert.deepStrictEqual(queue, `${locator.namespace}.${endpoint}`)
})

it('should name what an operator is told to declare', () => {
  // a region's queues are declared before it runs anything, from `toa export convergence`,
  // and what it prints is asserted here: one that exists under another name is one the
  // binding never consumes, and the records for that component are dropped upstream
  assert.equal(inbound(CHANNEL), INBOUND)
  assert.equal(outbound(CHANNEL), OUTBOUND)
  assert.equal(bound(CHANNEL, 'store.orders'), queue('store.orders'))
})

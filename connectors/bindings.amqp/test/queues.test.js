'use strict'

const { it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')

const { name } = require('../source/queues')

/** @type {toa.core.Locator} */
let locator

const endpoint = generate()

beforeEach(() => {
  locator = /** @type {toa.core.Locator} */ {
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

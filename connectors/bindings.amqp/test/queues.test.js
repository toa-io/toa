'use strict'

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
  expect(name).toBeInstanceOf(Function)
})

it('should name a queue', async () => {
  const queue = name(locator, endpoint)

  expect(queue).toStrictEqual(`${locator.namespace}.${locator.name}.${endpoint}`)
})

it('should name a queue with nameless locator', async () => {
  delete locator.name

  const queue = name(locator, endpoint)

  expect(queue).toStrictEqual(`${locator.namespace}.${endpoint}`)
})

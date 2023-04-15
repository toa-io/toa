'use strict'

const { Connector } = require('@toa.io/core')

const { Aspect } = require('../source/aspect')
const { Factory } = require('../')
const { generate } = require('randomstring')

/** @type {Factory} */
let factory

/** @type {toa.core.extensions.Aspect} */
let aspect

const locator = /** @type {toa.core.Locator} */ {}
const declaration = {}

beforeEach(() => {
  factory = new Factory()
  aspect = /** @type {toa.core.extensions.Aspect} */ factory.aspect(locator, declaration)
})

it('should be instance of Aspect', async () => {
  expect(aspect).toBeInstanceOf(Aspect)
})

it('should extend Connector', async () => {
  expect(aspect).toBeInstanceOf(Connector)
})

it('should expose name', async () => {
  expect(aspect.name).toStrictEqual('cache')
})

it('should implement invoke', async () => {
  expect(aspect.invoke).toBeDefined()
})

it('should cache', async () => {
  const value = { [generate()]: generate() }

  aspect.invoke(value)

  const output = aspect.invoke()

  expect(output).toStrictEqual(value)
})

it('should not replace value', async () => {
  const value1 = { [generate()]: generate() }
  const value2 = { [generate()]: generate() }

  aspect.invoke(value1)
  aspect.invoke(value2)

  const output = aspect.invoke()

  expect(output).toStrictEqual({ ...value1, ...value2 })
})

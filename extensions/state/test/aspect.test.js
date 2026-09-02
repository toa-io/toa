import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { Connector } from '@toa.io/core'

import { Aspect } from '../source/aspect.js'
import { Factory } from '../source/index.js'
import { generate } from 'randomstring'

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
  assert.ok(aspect instanceof Aspect)
})

it('should extend Connector', async () => {
  assert.ok(aspect instanceof Connector)
})

it('should expose name', async () => {
  assert.deepStrictEqual(aspect.name, 'state')
})

it('should implement invoke', async () => {
  assert.notStrictEqual(aspect.invoke, undefined)
})

it('should store', async () => {
  const value = { [generate()]: generate() }

  aspect.invoke(value)

  const output = aspect.invoke()

  assert.deepStrictEqual(output, value)
})

it('should not replace value', async () => {
  const value1 = { [generate()]: generate() }
  const value2 = { [generate()]: generate() }

  aspect.invoke(value1)
  aspect.invoke(value2)

  const output = aspect.invoke()

  assert.deepStrictEqual(output, { ...value1, ...value2 })
})

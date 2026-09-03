import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { Reflection, Connector } from '../src/index.js'

it('should export', () => {
  assert.notStrictEqual(Reflection, undefined)
})

/** @type {toa.core.Reflection<string>} */
let reflection

const value = generate()

/** @type {toa.core.reflection.Source<string>} */
const source = async () => value

beforeEach(() => {
  reflection = new Reflection(source)
})

it('should be a Connector', () => {
  assert.ok(reflection instanceof Connector)
})

it('should reflect', async () => {
  await reflection.connect()

  assert.deepStrictEqual(reflection.value, value)
})

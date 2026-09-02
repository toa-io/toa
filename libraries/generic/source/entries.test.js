import { it } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'

import { entries } from '../source/index.js'

it('should be', async () => {
  assert.ok(entries instanceof Function)
})

it('should return entries', async () => {
  const object = { [generate()]: generate() }
  const expected = Object.entries(object)
  const output = entries(object)

  assert.deepStrictEqual(output, expected)
})

it('should return symbols', async () => {
  const sym = Symbol('test')
  const value = generate()
  const key = generate()
  const object = { [key]: generate(), [sym]: value }
  const output = entries(object)

  assert.deepStrictEqual(output, [[key, object[key]], [sym, value]])
})

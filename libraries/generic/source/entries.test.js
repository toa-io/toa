'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')

const { entries } = require('../')

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

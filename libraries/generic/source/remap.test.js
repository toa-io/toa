'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { remap } = require('../source/remap')

it('should remap values', () => {
  const object = { a: 1, b: 2 }

  const result = remap(object, (value) => value + 1)

  assert.deepStrictEqual(result, { a: 2, b: 3 })
})

it('should not modify argument', () => {
  const object = { a: 1, b: 2 }

  remap(object, (value) => value + 1)

  assert.deepStrictEqual(object, { a: 1, b: 2 })
})

it('should pass key argument', () => {
  const object = { a: 1, b: 2 }

  const result = remap(object, (value, key) => key === 'b' ? value + 1 : value)

  assert.deepStrictEqual(result, { a: 1, b: 3 })
})

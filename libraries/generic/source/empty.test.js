'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { empty } = require('../source/empty')

it('should return true', () => {
  assert.strictEqual(empty({}), true)
})

it('should return false', () => {
  assert.strictEqual(empty({ a: 1 }), false)
})

it('should affect by non-enumerable properties', () => {
  const o = {}

  Object.defineProperty(o, 'a', { value: 1, enumerable: false })

  assert.strictEqual(empty(o), true)
})

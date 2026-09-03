import { it } from 'node:test'
import assert from 'node:assert/strict'

import { empty } from '../source/empty.js'

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

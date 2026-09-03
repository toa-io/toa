import { it } from 'node:test'
import assert from 'node:assert/strict'

import { seal } from '../source/seal.js'

it('should seal', () => {
  const object = { foo: 'bar' }

  seal(object)

  assert.throws(() => (object.bar = 'foo'), (error) => /not extensible/.test(error.message))
})

it('should deep seal', () => {
  const object = { foo: { bar: 'baz ' } }

  seal(object)

  assert.throws(() => (object.foo.baz = 'foo'), (error) => /not extensible/.test(error.message))
})

it('should not throw on null or undefined', () => {
  assert.doesNotThrow(() => seal(null))
  assert.doesNotThrow(() => seal(undefined))
})

it('should return frozen object', () => {
  const object = { foo: 'bar' }
  const result = seal(object)

  assert.strictEqual(result, object)
})

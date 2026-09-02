import { it } from 'node:test'
import assert from 'node:assert/strict'

import { freeze } from '../source/freeze.js'

it('should freeze', () => {
  const object = { foo: 'bar' }

  freeze(object)

  assert.throws(() => (object.foo = 'baz'), (error) => /read only property/.test(error.message))
  assert.throws(() => (object.bar = 'foo'), (error) => /not extensible/.test(error.message))
})

it('should deep freeze', () => {
  const object = { foo: { bar: 'baz ' } }

  freeze(object)

  assert.throws(() => (object.foo.bar = 'foo'), (error) => /read only property/.test(error.message))
  assert.throws(() => (object.foo.baz = 'foo'), (error) => /not extensible/.test(error.message))
})

it('should not throw on null or undefined', () => {
  assert.doesNotThrow(() => freeze(null))
  assert.doesNotThrow(() => freeze(undefined))
})

it('should return frozen object', () => {
  const object = { foo: 'bar' }
  const result = freeze(object)

  assert.strictEqual(result, object)
})

it('should return scalar values', () => {
  assert.strictEqual(freeze(1), 1)
})

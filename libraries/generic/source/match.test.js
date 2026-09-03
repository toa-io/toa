import { it } from 'node:test'
import assert from 'node:assert/strict'

import { match } from '../source/index.js'

it('should exist', () => {
  assert.notStrictEqual(match, undefined)
})

it('should match values', () => {
  assert.deepStrictEqual(match(1, 1), true)
  assert.deepStrictEqual(match('foo', 'foo'), true)
  assert.deepStrictEqual(match(1, 2), false)
  assert.deepStrictEqual(match(1, '1'), false)
})

it('should match arrays', () => {
  assert.deepStrictEqual(match([1, 2], [1, 2]), true)
  assert.deepStrictEqual(match([1, 2, 3], [2, 1]), true)
  assert.deepStrictEqual(match([1, 2, 3], [2, 1, 4]), false)
})

it('should not throw on type mismatch', () => {
  assert.deepStrictEqual(match(1, [1, 2]), false)
})

it('should match objects', () => {
  const reference = {
    foo: 'bar',
    baz: 1,
    qux: {
      arr: [1, 2],
      val: 'text'
    }
  }

  assert.deepStrictEqual(match(reference, { foo: 'bar' }), true)
  assert.deepStrictEqual(match(reference, { qux: { val: 'text' } }), true)
  assert.deepStrictEqual(match(reference, { qux: { val: 'whatever' } }), false)
  assert.deepStrictEqual(match(reference, { qux: { arr: [1, 2] } }), true)
  assert.deepStrictEqual(match(reference, { qux: { arr: [2, 5] } }), false)
  assert.deepStrictEqual(match(reference, {
    foo: 'bar',
    bar: 1
  }), false)
})

it('should not throw on nulls', () => {
  assert.deepStrictEqual(match(null, null), true)
  assert.deepStrictEqual(match(null, [1, 2]), false)
  assert.deepStrictEqual(match(null, { foo: 'bar' }), false)
  assert.deepStrictEqual(match([1, 2], null), false)
})

it('should match array items in objects', async () => {
  const reference = {
    foo: [
      { bar: 1 },
      { bar: 2 }
    ]
  }

  assert.deepStrictEqual(match(reference, { foo: [{ bar: 2 }] }), true)
})

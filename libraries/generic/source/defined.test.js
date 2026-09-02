import { it } from 'node:test'
import assert from 'node:assert/strict'

import { defined } from '../source/index.js'

it('should be', () => {
  assert.notStrictEqual(defined, undefined)
})

it('should remove undefined', () => {
  const object = { a: 1, b: undefined }

  defined(object)

  assert.deepStrictEqual(object, { a: 1 })
})

it('should return result', () => {
  const input = { a: 1, b: undefined }
  const output = defined(input)

  assert.deepStrictEqual(output, { a: 1 })
})

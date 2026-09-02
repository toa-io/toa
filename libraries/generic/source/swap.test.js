import { it } from 'node:test'
import assert from 'node:assert/strict'

import { swap } from '../source/index.js'
import { generate } from 'randomstring'

it('should be defined', () => {
  assert.notStrictEqual(swap, undefined)
})

it('should swap', () => {
  const key = generate()
  const value = generate()

  const object = { [key]: value }
  const result = swap(object)

  assert.deepStrictEqual(result, { [value]: key })
})

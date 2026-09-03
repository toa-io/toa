import { it } from 'node:test'
import assert from 'node:assert/strict'

import { transpose } from '../source/index.js'

it('should exist', () => {
  assert.notStrictEqual(transpose, undefined)
})

it('should transpose', () => {
  const array = [[1, 2, 3], [4, 5, 6]]
  const result = transpose(array)

  assert.deepStrictEqual(result, [[1, 4], [2, 5], [3, 6]])
})

it('should transpose row', () => {
  const array = [1, 2, 3]
  const result = transpose(array)

  assert.deepStrictEqual(result, [[1], [2], [3]])
})

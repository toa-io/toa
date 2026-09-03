import { it } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { sample } from '../source/sample.js'

const array = [1, 2, 3, 4, 5].map(() => generate())

it('should return array element', () => {
  const value = sample(array)

  assert.notStrictEqual(array.indexOf(value), -1)
})

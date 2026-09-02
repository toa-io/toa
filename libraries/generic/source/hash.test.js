import { it } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { hash } from '../source/index.js'

it('should hash', () => {
  const str = generate()

  const hash1 = hash(str)
  const hash2 = hash(str)
  const hash3 = hash(generate())

  assert.strictEqual(typeof hash1, 'string')
  assert.deepStrictEqual(hash1, hash2)
  assert.notDeepStrictEqual(hash1, hash3)
})

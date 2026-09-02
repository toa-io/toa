import { it } from 'node:test'
import assert from 'node:assert/strict'

import { newid } from '../source/index.js'

it('should return id', () => {
  const id = newid()

  assert.strictEqual(typeof id, 'string')
  assert.strictEqual(id.length, 32)
})

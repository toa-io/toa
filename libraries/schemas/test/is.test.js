import { it } from 'node:test'
import assert from 'node:assert/strict'

import { is } from '../source/index.js'

it('should be', async () => {
  assert.notStrictEqual(is, undefined)
})

it('should validate', async () => {
  const ok = { type: 'string' }
  const oh = { type: 'fruit' }

  assert.deepStrictEqual(is(ok), true)
  assert.deepStrictEqual(is(oh), false)
})

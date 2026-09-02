import { it } from 'node:test'
import assert from 'node:assert/strict'

import { concat } from '../source/concat.js'

it('should concat strings', () => {
  assert.strictEqual(concat('/', 'ref'), '/ref')
})

it('should return empty string if one of arguments is undefined', () => {
  assert.strictEqual(concat(undefined, '.'), '')
})

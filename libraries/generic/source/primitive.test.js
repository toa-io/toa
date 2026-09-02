import { it } from 'node:test'
import assert from 'node:assert/strict'

import { primitive } from '../source/index.js'

it('should be', async () => {
  assert.notStrictEqual(primitive, undefined)
})

for (const [type, value] of [
  ['undefined', undefined],
  ['boolean', true],
  ['number', 0],
  ['string', 'ok'],
  ['symbol', Symbol('ok')],
  ['bigint', 1n]
])
   it(`should return true for ${type}`, async () => {
  assert.deepStrictEqual(primitive(value), true)
})

import { it } from 'node:test'
import assert from 'node:assert/strict'

import { reduce } from '../source/index.js'

it('should be', async () => {
  assert.notStrictEqual(reduce, undefined)
})

it('should reduce to object', async () => {
  const items = [1, 2, 3]
  const reducer = (acc, item) => (acc.a = acc.a === undefined ? item : acc.a + item)
  const result = reduce(items, reducer)

  assert.deepStrictEqual(result.a, 6)
})

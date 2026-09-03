import { it } from 'node:test'
import assert from 'node:assert/strict'

import { memo } from './index.js'

it('should memoize returned values', async () => {
  let calls = 0

  function inc () {
    calls++

    return calls
  }

  const fn = memo(inc)

  const r1 = fn()
  const r2 = fn()

  assert.deepStrictEqual(r1, 1)
  assert.deepStrictEqual(r2, 1)
  assert.deepStrictEqual(calls, 1)
})

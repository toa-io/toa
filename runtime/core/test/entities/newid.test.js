import { it } from 'node:test'
import assert from 'node:assert/strict'

import { derive, newid } from '../../source/entities/newid.js'

it('should mint an id', () => {
  assert.match(newid(), /^[\da-f]{32}$/)
})

it('should mint a new one every time', () => {
  assert.notStrictEqual(newid(), newid())
})

it('should derive an id in the same shape', () => {
  assert.match(derive('a1', 'default.stock.reserve', 0), /^[\da-f]{32}$/)
})

// the whole of what it is for: the same call made again is the same call
it('should derive the same id from the same parts', () => {
  assert.strictEqual(
    derive('a1', 'default.stock.reserve', 0),
    derive('a1', 'default.stock.reserve', 0)
  )
})

it('should derive a different id from each part', () => {
  const one = derive('a1', 'default.stock.reserve', 0)

  assert.notStrictEqual(one, derive('a2', 'default.stock.reserve', 0))
  assert.notStrictEqual(one, derive('a1', 'default.billing.charge', 0))
  assert.notStrictEqual(one, derive('a1', 'default.stock.reserve', 1))
})

// or `a:b` and `c` would derive what `a` and `b:c` does
it('should not let one part read as another', () => {
  assert.notStrictEqual(derive('a', 'b:c'), derive('a:b', 'c'))
})

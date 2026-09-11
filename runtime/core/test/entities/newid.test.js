import { it } from 'node:test'
import assert from 'node:assert/strict'
import * as uuid from 'uuid'

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

// an identity is recorded with what a call changed, so one derived before a release is the one
// derived after it
it('should derive the bytes of a version 5 uuid in its namespace', () => {
  const namespace = '26bd9bc6-675c-4465-9b42-9e008b20befe'

  for (const parts of [[], [''], ['a1', 'default.stock.reserve', 0], ['ключ', '🙂', 7], ['x'.repeat(5000)]]) {
    const name = parts.map((part) => String(part).length + ':' + String(part)).join('')
    const buf = Buffer.alloc(16)

    uuid.v5(name, namespace, buf)

    assert.strictEqual(derive(...parts), buf.toString('hex'))
  }
})

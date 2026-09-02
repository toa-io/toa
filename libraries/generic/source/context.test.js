import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'

import * as fixtures from './.test/context.fixtures.js'
import { context, timeout } from '../source/index.js'

it('should be', () => {
  assert.notStrictEqual(context, undefined)
})

/** @type {symbol} */
let id

beforeEach(() => {
  id = Symbol(generate())
})

it('should return undefined on empty context', async () => {
  const storage = context(id)
  const value = storage.get()

  assert.strictEqual(value, undefined)
})

it('should track context', async () => {
  const storage = context(id)
  const v1 = { n: 0 }
  const v2 = { n: 0 }

  const p1 = storage.apply(v1, async () => {
    await timeout(1)
    await fixtures.increment(id)

    return 1
  })

  const p2 = storage.apply(v2, async () => {
    await timeout(1)
    await fixtures.increment(id)

    return 2
  })

  const [r1, r2] = await Promise.all([p1, p2])

  assert.deepStrictEqual(v1, { n: 1 })
  assert.deepStrictEqual(v2, { n: 1 })

  assert.deepStrictEqual(r1, 1)
  assert.deepStrictEqual(r2, 2)
})

it('should track nested context', async () => {
  
  const storage = context(id)

  const outer = { a: generate() }

  await storage.apply(outer, async () => {
    const storage = context(id)
    const value = storage.get()

    const inner = { b: generate() }

    await storage.apply(inner, async () => {
      const storage = context(id)
      const value = storage.get()

      assert.deepStrictEqual(value, inner)
    })

    assert.deepStrictEqual(value, outer)
  })
})

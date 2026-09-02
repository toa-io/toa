import { it } from 'node:test'
import assert from 'node:assert/strict'

import { immediate } from '../source/index.js'

it('should be', async () => {
  assert.notStrictEqual(immediate, undefined)
})

it('should run immediately', async () => {
  let a = false
  let b = false

  const func = async () => {
    a = true

    await immediate()

    b = true
  }

  setImmediate(async () => {
    assert.deepStrictEqual(a, true)
    assert.deepStrictEqual(b, false)

    await immediate()

    assert.deepStrictEqual(b, true)
  })

  await func()
})

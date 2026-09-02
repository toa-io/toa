'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { immediate } = require('../')

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

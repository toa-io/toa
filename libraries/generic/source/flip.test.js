'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { flip } = require('../')

it('should be', async () => {
  assert.notStrictEqual(flip, undefined)
})

it('should return true or false', async () => {
  let yeps = 0
  let nopes = 0

  for (let i = 0; i < 1000; i++) {
    const output = flip()

    assert.deepStrictEqual(typeof output, 'boolean')

    if (output) yeps++
    else nopes++
  }

  const diff = Math.abs(yeps - nopes)

  // eh
  assert.ok(diff < yeps)
  assert.ok(diff < nopes)
})

'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { swap } = require('../')
const { generate } = require('randomstring')

it('should be defined', () => {
  assert.notStrictEqual(swap, undefined)
})

it('should swap', () => {
  const key = generate()
  const value = generate()

  const object = { [key]: value }
  const result = swap(object)

  assert.deepStrictEqual(result, { [value]: key })
})

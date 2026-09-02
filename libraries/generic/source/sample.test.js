'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')
const { sample } = require('../source/sample')

const array = [1, 2, 3, 4, 5].map(() => generate())

it('should return array element', () => {
  const value = sample(array)

  assert.notStrictEqual(array.indexOf(value), -1)
})

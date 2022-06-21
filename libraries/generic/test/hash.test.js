'use strict'

const { generate } = require('randomstring')
const { hash } = require('../src')

it('should hash', () => {
  const str = generate()

  const hash1 = hash(str)
  const hash2 = hash(str)
  const hash3 = hash(generate())

  expect(typeof hash1).toBe('string')
  expect(hash1).toEqual(hash2)
  expect(hash1).not.toEqual(hash3)
})

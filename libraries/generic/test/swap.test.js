'use strict'

const { swap } = require('../')
const { generate } = require('randomstring')

it('should be defined', () => {
  expect(swap).toBeDefined()
})

it('should swap', () => {
  const key = generate()
  const value = generate()

  const object = { [key]: value }
  const result = swap(object)

  expect(result).toStrictEqual({ [value]: key })
})

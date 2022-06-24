'use strict'

const { generate } = require('randomstring')

const { manifest } = require('../')

it('should export', () => {
  expect(manifest).toBeInstanceOf(Function)
})

it('should throw if not an object', () => {
  const call = () => manifest(generate())
  expect(call).toThrow(/must be object/)
})

it('should throw if not a valid schema', () => {
  const object = { type: generate() }
  const call = () => manifest(object)

  expect(call).toThrow(/one of the allowed values/)
})

'use strict'

const { generate } = require('randomstring')
const mock = { merge: jest.fn(() => generate()) }

jest.mock('../src/merge', () => mock)
const { patch } = require('../')

it('should be', () => {
  expect(patch).toBeInstanceOf(Function)
})

it('should call merge with override', () => {
  const target = { a: 1 }
  const source = { a: 2 }
  const options = { override: true }

  const result = patch(target, source)

  expect(mock.merge).toHaveBeenCalledWith(target, source, options)
  expect(result).toStrictEqual(mock.merge.mock.results[0].value)
})

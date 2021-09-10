'use strict'

const { concat } = require('../src/concat')

it('should concat strings', () => {
  expect(concat('/', 'ref')).toBe('/ref')
})

it('should return empty string if one of arguments is undefined', () => {
  expect(concat(undefined, '.')).toBe('')
})

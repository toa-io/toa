'use strict'

const { primitive } = require('../source')

it('should be', async () => {
  expect(primitive).toBeDefined()
})

it.each([
  ['undefined', undefined],
  ['boolean', true],
  ['number', 0],
  ['string', 'ok'],
  ['symbol', Symbol('ok')],
  ['bigint', 1n]
])('should return true for %s', async (type, value) => {
  expect(primitive(value)).toStrictEqual(true)
})

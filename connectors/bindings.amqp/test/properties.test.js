'use strict'

const { properties } = require('../')

it('should export properties', async () => {
  expect(properties).toStrictEqual({ async: true })
})

'use strict'

it('should export PREFIX', () => {
  const { PREFIX } = require('../')

  expect(PREFIX).toStrictEqual('TOA_CONFIGURATION_')
})

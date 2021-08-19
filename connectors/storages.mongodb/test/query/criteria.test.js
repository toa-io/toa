'use strict'

const fixtures = require('./criteria.fixtures')
const { criteria } = require('../../src/query/criteria')

it('should translate', () => {
  const result = criteria(fixtures.ast)

  expect(result).toStrictEqual(fixtures.criteria)
})

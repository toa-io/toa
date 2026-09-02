'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const fixtures = require('./criteria.fixtures')
const { criteria } = require('../../src/translate/criteria')

it('should translate', () => {
  const result = criteria(fixtures.ast)

  assert.deepStrictEqual(result, fixtures.criteria)
})

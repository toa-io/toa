'use strict'

const { generate } = require('randomstring')

const { Conditions } = require('../../src/contract/conditions')
const fixtures = require('./contract.fixtures')

let conditions

beforeEach(() => {
  conditions = new Conditions(fixtures.schema)
})

it('should fit value', () => {
  const value = { foo: generate() }

  conditions.fit(value)

  expect(fixtures.schema.fit).toHaveBeenCalledWith(value)
})

it('should throw on invalid value', () => {
  const value = { invalid: true }

  expect(() => conditions.fit(value)).toThrow()
})

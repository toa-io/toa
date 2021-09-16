'use strict'

const { generate } = require('randomstring')

const { Conditions } = require('../../src/contract/conditions')
const fixtures = require('./contract.fixtures')

let conditions

beforeEach(() => {
  conditions = new Conditions(fixtures.schema)
})

it('should provide schema', () => {
  const props = { input: 1, output: undefined }

  expect(Conditions.schema(props)).toStrictEqual({ properties: { input: 1 } })
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

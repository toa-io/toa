'use strict'

const { generate } = require('randomstring')

const { Contract } = require('../../src/contract/contract')
const fixtures = require('./contract.fixtures')

let contract

beforeEach(() => {
  contract = new Contract(fixtures.schema)
})

it('should fit value', () => {
  const value = { foo: generate() }

  contract.fit(value)

  expect(fixtures.schema.fit).toHaveBeenCalledWith(value)
})

it('should throw on invalid value', () => {
  const value = { invalid: true }

  expect(() => contract.fit(value)).toThrow()
})

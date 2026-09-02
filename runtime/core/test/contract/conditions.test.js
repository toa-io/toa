'use strict'

const { it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

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

  assert.ok(fixtures.schema.fit.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], value)))
})

it('should throw on invalid value', () => {
  const value = { invalid: true }

  assert.throws(() => contract.fit(value))
})

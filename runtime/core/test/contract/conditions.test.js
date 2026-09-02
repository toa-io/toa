import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'

import { Contract } from '../../src/contract/contract.js'
import * as fixtures from './contract.fixtures.js'

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

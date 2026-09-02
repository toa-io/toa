'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { EntitySet } = require('../../src/entities/set')
const fixtures = require('./set.fixtures')

it('should provide state', () => {
  const set = new EntitySet(fixtures.set)
  const state = set.get()
  const expected = fixtures.set.map((entity) => entity.get.mock.calls[0].result)

  assert.deepStrictEqual(state, expected)
})

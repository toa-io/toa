'use strict'

const { Set } = require('../../src/entities/set')
const fixtures = require('./set.fixtures')

it('should provide state', () => {
  const set = new Set(fixtures.set)
  const state = set.get()
  const expected = fixtures.set.map((entry) => entry.get.mock.results[0].value)

  expect(state).toStrictEqual(expected)
})

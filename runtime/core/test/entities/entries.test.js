'use strict'

const { Entries } = require('../../src/entities/entries')
const fixtures = require('./entries.fixtures')

it('should provide state', () => {
  const entries = new Entries(fixtures.entries)
  const state = entries.get()
  const expected = fixtures.entries.map((entry) => entry.get.mock.results[0].value)

  expect(state).toStrictEqual(expected)
})

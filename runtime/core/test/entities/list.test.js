'use strict'

const { List } = require('../../src/entities/list')
const fixtures = require('./list.fixtures')

it('should provide state', () => {
  const list = new List(fixtures.entries)
  const state = list.get()
  const expected = fixtures.entries.map((entry) => entry.get.mock.results[0].value)

  expect(state).toStrictEqual(expected)
})

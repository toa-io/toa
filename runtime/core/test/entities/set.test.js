'use strict'

const { EntitySet } = require('../../src/entities/set')
const fixtures = require('./set.fixtures')

it('should provide state', () => {
  const set = new EntitySet(fixtures.set)
  const state = set.get()
  const expected = fixtures.set.map((entity) => entity.get.mock.results[0].value)

  expect(state).toStrictEqual(expected)
})

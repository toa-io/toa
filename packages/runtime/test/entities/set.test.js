'use strict'

const { Set } = require('../../src/entities/set')
const fixtures = require('./set.fixtures')

it('should provide state', () => {
  const set = new Set(fixtures.set)
  const state = fixtures.set.map((entry) => entry.state)

  expect(set.state).toStrictEqual(state)
})

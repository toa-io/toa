'use strict'

const { Query } = require('../src/query')
const fixtures = require('./query.fixtures')

let query

beforeEach(() => {
  jest.clearAllMocks()

  query = new Query({ criteria: fixtures.samples.types.schema })
})

it('.', () => {
  expect(query).toBeDefined()
})

// describe('criteria', () => {
//   it('should parse criteria', () => {
//     const { criteria } = query.parse({ ...fixtures.samples.simple.query })
//
//     expect(criteria).toEqual(fixtures.samples.simple.parsed.criteria)
//   })
//
//   it('should parse criteria with type coercion', () => {
//     const { criteria } = query.parse({ ...fixtures.samples.types.query })
//
//     expect(criteria).toEqual(fixtures.samples.types.parsed.criteria)
//   })
// })

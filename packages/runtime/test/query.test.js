'use strict'

const { Query } = require('../src/query')
const fixtures = require('./query.fixtures')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('criteria', () => {
  it('should return null if query is null', () => {
    const instance = new Query(fixtures.samples.simple.options, fixtures.samples.simple.properties)
    const query = instance.parse(null)

    expect(query).toBeNull()
  })

  it('should parse criteria', () => {
    const instance = new Query(fixtures.samples.simple.options, fixtures.samples.simple.properties)
    const query = instance.parse(fixtures.samples.simple.query)

    expect(query.criteria).toEqual(fixtures.samples.simple.parsed.criteria)
  })

  it('should parse criteria with type coercion', () => {
    const instance = new Query(fixtures.samples.types.options, fixtures.samples.types.properties)
    const query = instance.parse(fixtures.samples.types.query)

    expect(query.criteria).toEqual(fixtures.samples.types.parsed.criteria)
  })
})

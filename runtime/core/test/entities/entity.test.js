'use strict'

const { Exception } = require('../../src/contract/exception')
const { Entity } = require('../../src/entities/entity')
const fixtures = require('./entity.fixtures')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('new', () => {
  let entry

  beforeEach(() => {
    entry = new Entity(fixtures.schema)
  })

  it('should throw on schema error', () => {
    const state = { ...fixtures.entry, fail: true }

    expect(() => entry.set(state)).toThrow(expect.any(Exception))
  })

  it('should provide state', () => {
    entry.set(fixtures.entry)

    expect(entry.get()).toEqual(fixtures.entry)
  })
})

describe('argument', () => {
  it('should provide blank', () => {
    const entry = new Entity(fixtures.schema)

    expect(entry.get()).toStrictEqual({
      id: expect.any(String),
      ...fixtures.schema.defaults.mock.results[0].value
    })
  })

  it('should set initial state', () => {
    const entry = new Entity(fixtures.schema, fixtures.entry)

    expect(entry.get()).toStrictEqual(fixtures.entry)
  })

  it('should not validate initial state', () => {
    const state = { ...fixtures.entry, fail: true }
    const entry = new Entity(fixtures.schema, state)

    expect(entry.get()).toStrictEqual(state)
  })
})

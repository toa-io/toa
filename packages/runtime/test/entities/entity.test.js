'use strict'

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

  it('should fail on schema error', () => {
    const object = { ...fixtures.entry, fail: true }

    expect(() => { entry.state = object }).toThrow(/doesn't match entity schema/)
  })

  it('should provide state', () => {
    entry.state = fixtures.entry

    expect(entry.state).toEqual(fixtures.entry)
  })

  it('should update state', () => {
    entry.state = fixtures.entry

    const state = { ...entry.state }

    state.foo = 1
    entry.state = state

    const { foo, ...rest } = fixtures.entry

    expect(entry.state).not.toEqual(fixtures.entry)
    expect(entry.state).toEqual({ foo: 1, ...rest })
  })
})

it('should provide blank', () => {
  const entry = new Entity(fixtures.schema, fixtures.id())

  expect(entry.state).toStrictEqual({
    id: fixtures.id.mock.results[0].value,
    ...fixtures.schema.defaults.mock.results[0].value
  })
})

it('should set initial state', () => {
  const entry = new Entity(fixtures.schema, fixtures.entry)

  expect(entry.state).toStrictEqual(fixtures.entry)
})

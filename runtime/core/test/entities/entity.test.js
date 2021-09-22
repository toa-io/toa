'use strict'

const { Exception } = require('../../src/exception')
const { Entity } = require('../../src/entities/entity')
const fixtures = require('./entity.fixtures')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('new', () => {
  it('should throw on schema error', () => {
    const entry = new Entity(fixtures.schema)

    expect(() => entry.set(fixtures.failed())).toThrow(expect.any(Exception))
  })

  it('should provide state', () => {
    const entry = new Entity(fixtures.schema)
    const state = fixtures.state()

    entry.set(state)

    expect(entry.get()).toEqual(state)
  })
})

describe('argument', () => {
  it('should provide initial state if no argument passed', () => {
    const entry = new Entity(fixtures.schema)

    expect(entry.get()).toStrictEqual({
      id: expect.any(String),
      ...fixtures.schema.defaults.mock.results[0].value
    })
  })

  it('should set provide origin state', () => {
    const state = fixtures.state()
    const entry = new Entity(fixtures.schema, state)

    expect(entry.get()).toStrictEqual(state)
  })

  it('should not validate origin state', () => {
    const state = fixtures.failed()
    const entry = new Entity(fixtures.schema, state)

    expect(entry.get()).toStrictEqual(state)
  })
})

it('should provide event', () => {
  const origin = fixtures.state()
  const entry = new Entity(fixtures.schema, origin)
  const state = entry.get()

  state.foo = 'new value'
  entry.set(state)

  const event = entry.event()

  expect(event).toStrictEqual({
    state,
    origin: origin,
    changeset: { foo: 'new value' }
  })
})

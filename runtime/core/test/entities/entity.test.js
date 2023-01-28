'use strict'

const { Entity } = require('../../src/entities/entity')
const fixtures = require('./entity.fixtures')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('new', () => {
  it('should throw on schema error', () => {
    const entity = new Entity(fixtures.schema)

    expect(() => entity.set(fixtures.failed())).toThrow()
  })

  it('should provide state', () => {
    const entity = new Entity(fixtures.schema)
    const state = fixtures.state()

    entity.set(state)

    expect(entity.get()).toEqual(state)
  })
})

describe('argument', () => {
  it('should provide initial state if no argument passed', () => {
    const entity = new Entity(fixtures.schema)
    const defaults = fixtures.schema.defaults.mock.results[0].value
    const expected = { ...defaults, _version: 0 }

    expect(entity.get()).toStrictEqual(expected)
  })

  it('should set state', () => {
    const state = fixtures.state()
    const entity = new Entity(fixtures.schema, state)

    expect(entity.get()).toStrictEqual(state)
  })
})

it('should provide event', () => {
  const origin = fixtures.state()
  const entity = new Entity(fixtures.schema, origin)
  const state = entity.get()

  state.foo = 'new value'
  entity.set(state)

  const event = entity.event()

  expect(event).toStrictEqual({
    state,
    origin: origin,
    changeset: { foo: 'new value' }
  })
})

it('should define `id` as readonly', async () => {
  const origin = fixtures.state()
  const entity = new Entity(fixtures.schema, origin)
  const state = entity.get()

  expect(() => (state.id = 1)).toThrow('assign to read only property')
})

it('should seal id', async () => {
  const origin = fixtures.state()
  const entity = new Entity(fixtures.schema, origin)
  const state = entity.get()
  const redefine = () => Object.defineProperty(state, 'id', { writable: true })

  expect(redefine).toThrow('redefine property')
})

'use strict'

const { Entity } = require('../../src/entities/entity')
const fixtures = require('./entity.fixtures')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('argument', () => {
  it('should set state', () => {
    const state = fixtures.state()
    const entity = new Entity(fixtures.schema, state)

    expect(entity.get()).toEqual(state)
  })
})

describe('tombstone', () => {
  it('should lift tombstone when transition leaves _deleted untouched', () => {
    const origin = fixtures.state()
    const entity = new Entity(fixtures.schema, origin)
    const state = entity.get()

    state.foo = 'revived'
    entity.set(state)

    expect(entity.get()._deleted).toBeNull()
    expect(entity.deleted).toBe(false)
    expect(entity.event().changeset._deleted).toBeNull()
  })

  it('should keep tombstone written by transition', () => {
    const origin = { ...fixtures.state(), _deleted: null }
    const entity = new Entity(fixtures.schema, origin)
    const state = entity.get()
    const timestamp = Date.now()

    state._deleted = timestamp
    entity.set(state)

    expect(entity.get()._deleted).toBe(timestamp)
    expect(entity.deleted).toBe(true)
  })
})

it('should provide event', () => {
  const origin = fixtures.state()
  const entity = new Entity(fixtures.schema, origin)
  const state = entity.get()

  state.foo = 'new value'
  entity.set(state)

  const event = entity.event()

  expect(event).toEqual(expect.objectContaining({
    state,
    origin,
    changeset: expect.objectContaining({
      foo: 'new value',
      _version: 1
    })
  }))
})

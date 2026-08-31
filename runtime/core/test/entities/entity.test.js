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

  it('should snapshot the record it may commit', () => {
    const record = fixtures.state()
    const entity = new Entity(fixtures.schema, record)

    expect(entity.get()).not.toBe(record)
    expect(entity.event().origin).toBe(record)
  })
})

describe('read-only', () => {
  it('should take the record as it came', () => {
    const record = fixtures.state()
    const entity = new Entity(fixtures.schema, record, undefined, false)

    // no pre-image to diff against, hence no copy of it
    expect(entity.get()).toBe(record)
  })

  it('should still report a tombstone', () => {
    const record = { ...fixtures.state(), _deleted: Date.now() }
    const entity = new Entity(fixtures.schema, record, undefined, false)

    expect(entity.deleted).toBe(true)
  })

  it('should refuse to be modified', () => {
    const entity = new Entity(fixtures.schema, fixtures.state(), undefined, false)

    expect(() => entity.set(entity.get())).toThrow('read-only')
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
    expect(entity.event().state._deleted).toBeNull()
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

  expect(event).toEqual(expect.objectContaining({ state, origin }))
  expect(event.state.foo).toBe('new value')
  expect(event.state._version).toBe(1)
  expect(event.origin.foo).not.toBe('new value')
})

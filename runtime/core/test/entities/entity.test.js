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

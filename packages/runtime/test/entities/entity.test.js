'use strict'

const { Entity } = require('../../src/entities/entity')
const fixtures = require('./entity.fixtures')

let entity

beforeEach(() => {
  jest.clearAllMocks()

  entity = new Entity(fixtures.schema)
})

it('should fail on schema error', () => {
  const object = { ...fixtures.object, fail: true }

  expect(() => { entity.state = object }).toThrow(/doesn't match entity schema/)
})

it('should provide state', () => {
  entity.state = fixtures.object

  expect(entity.state).toEqual(fixtures.object)
})

it('should update state', () => {
  entity.state = fixtures.object

  const state = { ...entity.state }

  state.foo = 1
  entity.state = state

  const { foo, ...rest } = fixtures.object

  expect(entity.state).not.toEqual(fixtures.object)
  expect(entity.state).toEqual({ foo: 1, ...rest })
})

'use strict'

const { Factory } = require('../src/entities/factory')
const fixtures = require('./entities.fixtures')

let factory

beforeEach(() => {
  jest.clearAllMocks()

  factory = new Factory(fixtures.schema, fixtures.id)
})

describe('entity', () => {
  let entity

  beforeEach(() => {
    entity = factory.create(fixtures.value)
  })

  it('should contain value', () => {
    expect(entity).toEqual(fixtures.value)
  })

  it('should fit', () => {
    expect(fixtures.schema.fit).toHaveBeenCalledWith(fixtures.value)
  })

  it('should hide system properties', () => {
    entity = factory.create({ ...fixtures.value, ...fixtures.system })

    expect(entity).toEqual(fixtures.value)
  })

  it('should construct', () => {
    const value = { ...fixtures.value, ...fixtures.system }
    entity = factory.create(value)

    const result = entity._construct()

    expect(result).toEqual(value)
    expect(fixtures.schema.fit).toHaveBeenCalledWith(value)
  })

  describe('validation', () => {
    it('should throw on invalid initial value', () => {
      const create = () => factory.create({ invalid: true })

      expect(create).toThrow(/does not match entity schema/)
    })

    it('should return false on invalid value serialization', () => {
      entity = factory.create(fixtures.value)

      entity.invalid = true

      const result = entity._construct()

      expect(result).toBe(false)
    })
  })
})

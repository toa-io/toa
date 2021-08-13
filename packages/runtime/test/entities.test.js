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

  beforeEach(async () => {
    jest.clearAllMocks()
    entity = await factory.create(fixtures.value)
  })

  it('should contain value', () => {
    expect(entity).toEqual(fixtures.value)
  })

  it('should fit', () => {
    expect(fixtures.schema.fit).toHaveBeenCalledWith(fixtures.value)
  })

  it('should hide system properties', async () => {
    entity = await factory.create({ ...fixtures.value, ...fixtures.system })

    expect(entity).toEqual(fixtures.value)
  })

  it('should construct', async () => {
    const value = { ...fixtures.value, ...fixtures.system }
    entity = await factory.create(value)

    const result = entity._construct()

    expect(result).toEqual(value)
    expect(fixtures.schema.fit).toHaveBeenCalledWith(value)
  })

  it('should create new object', async () => {
    jest.clearAllMocks()

    const entity = await factory.create()
    const _id = fixtures.id.mock.results[0].value

    expect(entity).toMatchObject({ _id })
    expect(fixtures.schema.fit).toHaveBeenCalledWith(entity)
  })

  describe('validation', () => {
    it('should throw on invalid initial value', async () => {
      const create = () => factory.create({ invalid: true })

      await expect(create).rejects.toThrow(/does not match entity schema/)
    })

    it('should throw on invalid value', async () => {
      entity = await factory.create(fixtures.value)
      entity.invalid = true

      expect(() => entity._construct()).toThrow(/error/)
    })
  })
})

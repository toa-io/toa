'use strict'

const clone = require('clone-deep')

const fixtures = require('./entity.factory.fixtures')
const mock = fixtures.mock

jest.mock('../../src/entities/entity', () => mock.entity)

const { Factory } = require('../../src/entities/factory')

let factory
let entity

beforeEach(() => {
  jest.clearAllMocks()

  factory = new Factory(fixtures.schema, fixtures.id)
})

describe('value', () => {
  beforeEach(() => (entity = factory.create(clone(fixtures.value))))

  it('should return proxied Entity instance', () => {
    expect(entity).toStrictEqual(fixtures.schema.proxy.mock.results[0].value)
    expect(fixtures.schema.proxy).toHaveBeenCalledWith(fixtures.mock.entity.Entity.mock.results[0].value)
    expect(fixtures.mock.entity.Entity).toHaveBeenCalledWith(fixtures.value)
  })
})

describe('new', () => {
  beforeEach(() => (entity = factory.create(null)))

  it('should identify', () => {
    expect(entity._id).toBe(fixtures.id.mock.results[0].value)
  })

  it('should assign defaults', () => {
    expect(entity).toStrictEqual(expect.objectContaining(fixtures.schema.defaults.mock.results[0].value))
  })
})

describe('invalid', () => {
  it('should throw', () => {
    const creation = () => factory.create(fixtures.invalid)

    expect(creation).toThrow(/does not match entity schema/)
  })
})

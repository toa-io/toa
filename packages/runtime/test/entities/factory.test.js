'use strict'

const fixtures = require('./factory.fixtures')
const mock = fixtures.mock

jest.mock('../../src/entities/entity', () => ({ Entity: mock.Entity }))

const { Factory } = require('../../src/entities/factory')

let factory

beforeEach(async () => {
  jest.clearAllMocks()

  factory = new Factory(fixtures.schema, fixtures.storage)
})

describe('factory', () => {
  it('should create blank', () => {
    const blank = factory.blank()

    expect(blank).toBeInstanceOf(mock.Entity)
    expect(blank.constructor).toHaveBeenCalledWith(fixtures.schema, fixtures.storage.id.mock.results[0].value)
  })

  it('should create instance', () => {
    const instance = factory.create(fixtures.state)

    expect(instance).toBeInstanceOf(mock.Entity)
    expect(instance.constructor).toHaveBeenCalledWith(fixtures.schema)
    expect(instance.state).toEqual(fixtures.state)
  })
})

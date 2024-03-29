'use strict'

const { generate } = require('randomstring')

const fixtures = require('./factory.fixtures')
const mock = fixtures.mock

jest.mock('../../src/entities/entity', () => ({ Entity: mock.Entity }))
jest.mock('../../src/entities/set', () => ({ EntitySet: mock.EntitySet }))

const { Factory } = require('../../src/entities/factory')

let factory

beforeEach(async () => {
  jest.clearAllMocks()

  factory = new Factory(fixtures.schema, () => fixtures.storage.id())
})

it('should create initial', () => {
  const id = generate()
  const initial = factory.init(id)

  expect(initial).toBeInstanceOf(mock.Entity)
  expect(initial.constructor).toHaveBeenCalledWith(fixtures.schema, id)
})

it('should create instance', () => {
  const object = factory.object(fixtures.entity)

  expect(object).toBeInstanceOf(mock.Entity)
  expect(object.constructor).toHaveBeenCalledWith(fixtures.schema, fixtures.entity)
})

it('should create set', () => {
  const objects = factory.objects(fixtures.set)

  expect(objects).toBeInstanceOf(mock.EntitySet)

  const instances = fixtures.set.map((entity, index) => {
    expect(mock.Entity).toHaveBeenNthCalledWith(index + 1, fixtures.schema, entity)

    return mock.Entity.mock.instances[index]
  })

  expect(objects.constructor).toHaveBeenCalledWith(instances)
})

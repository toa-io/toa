'use strict'

const { generate } = require('randomstring')

const fixtures = require('./factory.fixtures')
const mock = fixtures.mock

jest.mock('../../src/entities/entity', () => ({ Entity: mock.Entity }))
jest.mock('../../src/entities/list', () => ({ List: mock.List }))

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
  const entry = factory.entry(fixtures.entry)

  expect(entry).toBeInstanceOf(mock.Entity)
  expect(entry.constructor).toHaveBeenCalledWith(fixtures.schema, fixtures.entry)
})

it('should create list', () => {
  const list = factory.list(fixtures.list)

  expect(list).toBeInstanceOf(mock.List)

  const instances = fixtures.list.map((entry, index) => {
    expect(mock.Entity).toHaveBeenNthCalledWith(index + 1, fixtures.schema, entry)

    return mock.Entity.mock.instances[index]
  })

  expect(list.constructor).toHaveBeenCalledWith(instances)
})

'use strict'

const fixtures = require('./runtime.fixtures')
const mock = fixtures.mock

jest.mock('@kookaburra/runtime', () => mock['@kookaburra/runtime'])
jest.mock('@kookaburra/package', () => mock['@kookaburra/package'])
jest.mock('@kookaburra/storage-mongodb', () => mock['@kookaburra/storage-mongodb'])

const { runtime } = require('../src/runtime')

const {
  schemas, entities,
  Connector, Invocation, Locator, Operation, Runtime, State
} = fixtures.mock['@kookaburra/runtime']

let instance

beforeEach(async () => {
  jest.clearAllMocks()

  instance = await runtime(fixtures.dirs.stateful)
})

it('should create runtime', () => {
  expect(instance).toStrictEqual(Runtime.mock.results[0].value)
  expect(Runtime).toHaveBeenCalledTimes(1)
})

it('should create locator', () => {
  // invocations argument is checked below
  expect(Runtime).toHaveBeenCalledWith(Locator.mock.results[0].value, expect.anything())
})

it('should create invocations', () => {
  const invocations = {}

  let sch = 1 // entity schema

  expect(entities.Factory).toHaveBeenCalledWith(schemas.Schema.mock.results[0].value)

  expect(schemas.Schema).toHaveBeenCalledWith(
    fixtures.components.stateful.entity.schema.$id,
    schemas.Validator.mock.results[0].value
  )

  expect(schemas.Validator.mock.results[0].value.add).toHaveBeenCalledWith(fixtures.components.stateful.entity.schema)

  fixtures.components.default.operations.forEach((operation, index) => {
    const schema = operation.input?.schema ? schemas.Schema.mock.results[sch++].value : undefined

    expect(Invocation).toHaveBeenNthCalledWith(index + 1,
      Operation.mock.results[index].value,
      schema
    )

    expect(State).toHaveBeenNthCalledWith(index + 1,
      expect.any(Connector),
      entities.Factory.mock.results[0].value
    )

    expect(State.mock.results[index].value.query).toEqual(State.mock.results[index].value[operation.target])

    expect(Operation).toHaveBeenNthCalledWith(index + 1,
      operation,
      State.mock.results[index].value
    )

    invocations[operation.name] = Invocation.mock.results[index].value
  })

  // locator argument is checked above
  expect(Runtime).toHaveBeenCalledWith(expect.anything(), invocations)
})

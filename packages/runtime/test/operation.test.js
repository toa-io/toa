'use strict'

const { Operation } = require('../src/operation')
const fixtures = require('./operation.fixtures')

let operation

beforeEach(() => {
  operation = new Operation(fixtures.operations.transition, fixtures.target)

  jest.clearAllMocks()
})

it('should execute', async () => {
  await operation.execute()

  expect(fixtures.operations.transition.algorithm).toBeCalled()
})

it('should pass io', async () => {
  await operation.execute(fixtures.io)

  expect(fixtures.operations.transition.algorithm).toBeCalledWith(fixtures.io, expect.anything())
})

it('should pass state', async () => {
  await operation.execute(fixtures.io, fixtures.query)

  expect(fixtures.target.query).toHaveBeenCalledWith(fixtures.query)

  expect(fixtures.operations.transition.algorithm)
    .toHaveBeenCalledWith(expect.anything(), fixtures.target.query.mock.results[0].value)
})

it('should persist state after transition', async () => {
  await operation.execute(fixtures.io, fixtures.query)

  expect(fixtures.target.persist).toHaveBeenCalledWith(fixtures.target.query.mock.results[0].value)
})

it('should pass frozen state to observation', async () => {
  const operation = new Operation(fixtures.operations.observation, fixtures.target)

  await operation.execute(fixtures.io, fixtures.query)

  expect(() => (fixtures.target.query.mock.results[0].value.test = 'foo')).toThrow(/object is not extensible/)
  expect(() => (fixtures.target.query.mock.results[0].value.foo = 'bar')).toThrow(/read only property/)
})

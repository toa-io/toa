'use strict'

const { Operation } = require('../src/operation')
const fixtures = require('./operation.fixtures')

let operation

beforeEach(() => {
  operation = new Operation(fixtures.operations.transition, fixtures.target)

  jest.clearAllMocks()
})

it('should invoke', async () => {
  await operation.invoke()

  expect(fixtures.operations.transition.algorithm).toBeCalled()
})

it('should pass io', async () => {
  await operation.invoke(fixtures.io)

  expect(fixtures.operations.transition.algorithm).toBeCalledWith(fixtures.io, expect.anything())
})

it('should pass target', async () => {
  await operation.invoke(fixtures.io, fixtures.query)

  expect(fixtures.target.query).toHaveBeenCalledWith(fixtures.query)

  expect(fixtures.operations.transition.algorithm)
    .toHaveBeenCalledWith(expect.anything(), fixtures.target.query.mock.results[0].value.state)
})

it('should commit target after transition', async () => {
  await operation.invoke(fixtures.io, fixtures.query)

  expect(fixtures.target.commit).toHaveBeenCalledWith(fixtures.target.query.mock.results[0].value)
})

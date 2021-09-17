'use strict'

const { Operation } = require('../src/operation')
const fixtures = require('./operation.fixtures')

let operation

beforeEach(() => {
  operation = new Operation(fixtures.declaration.transition, fixtures.bridges.transition, fixtures.target, fixtures.contract)

  jest.clearAllMocks()
})

it('should invoke', async () => {
  await operation.invoke({})

  expect(fixtures.bridges.transition.run).toBeCalled()
})

it('should pass request', async () => {
  await operation.invoke(fixtures.request)

  expect(fixtures.bridges.transition.run).toBeCalledWith(fixtures.request.input, expect.anything())
})

it('should pass target', async () => {
  await operation.invoke(fixtures.request)

  expect(fixtures.target.query).toHaveBeenCalledWith(fixtures.request.query)

  expect(fixtures.bridges.transition.run)
    .toHaveBeenCalledWith(expect.anything(), fixtures.target.query.mock.results[0].value.get.mock.results[0].value)
})

it('should return { output: null } if target is null', async () => {
  const result = await operation.invoke({ query: { mock: null } })

  expect(result).toStrictEqual({ output: null })
  expect(fixtures.bridges.transition.run).not.toHaveBeenCalled()
})

it('should commit target after transition', async () => {
  await operation.invoke(fixtures.request)

  expect(fixtures.target.commit).toHaveBeenCalledWith(fixtures.target.query.mock.results[0].value)
})

it('should not commit target after observation', async () => {
  await new Operation(fixtures.declaration.observation, fixtures.bridges.observation, fixtures.target).invoke(fixtures.request)

  expect(fixtures.target.commit).not.toHaveBeenCalled()
})

it('should not commit target after error', async () => {
  await new Operation(fixtures.declaration.transition, fixtures.bridges.error, fixtures.target).invoke(fixtures.request)

  expect(fixtures.target.commit).not.toHaveBeenCalled()
})

it('should pass reply', async () => {
  const reply = await operation.invoke(fixtures.request)

  expect(reply).toStrictEqual(fixtures.bridges.transition.run.mock.results[0].value)
})

it('should fit reply', async () => {
  await operation.invoke(fixtures.request)

  expect(fixtures.contract.fit).toHaveBeenCalledWith(fixtures.bridges.transition.run.mock.results[0].value)
})

'use strict'

const { Operation } = require('../src/operation')
const fixtures = require('./operation.fixtures')

let operation

beforeEach(() => {
  jest.clearAllMocks()
  operation = new Operation(fixtures.cascade, fixtures.subject, fixtures.contract, fixtures.query)
})

it('should invoke', async () => {
  await operation.invoke({})

  expect(fixtures.cascade.run).toBeCalled()
})

it('should pass input', async () => {
  await operation.invoke(fixtures.request)

  expect(fixtures.cascade.run).toBeCalledWith(fixtures.request.input, expect.anything())
})

it('should pass state', async () => {
  await operation.invoke(fixtures.request)

  expect(fixtures.query.parse).toHaveBeenCalledWith(fixtures.request.query)
  expect(fixtures.subject.query).toHaveBeenCalledWith(fixtures.query.parse.mock.results[0].value)

  expect(fixtures.cascade.run)
    .toHaveBeenCalledWith(expect.anything(), fixtures.subject.query.mock.results[0].value.get.mock.results[0].value)
})

it('should return { output: null } if target is null', async () => {
  const result = await operation.invoke({ query: { mock: null } })

  expect(result).toStrictEqual({ output: null })
  expect(fixtures.cascade.run).not.toHaveBeenCalled()
})

it('should return reply', async () => {
  const reply = await operation.invoke(fixtures.request)

  expect(reply).toStrictEqual(fixtures.cascade.run.mock.results[0].value)
})

it('should fit reply', async () => {
  await operation.invoke(fixtures.request)

  expect(fixtures.contract.fit).toHaveBeenCalledWith(fixtures.cascade.run.mock.results[0].value)
})

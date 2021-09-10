'use strict'

const { Operation } = require('../src/operation')
const fixtures = require('./operation.fixtures')

let operation

beforeEach(() => {
  operation = new Operation(fixtures.bridges.transition, fixtures.target)

  jest.clearAllMocks()
})

it('should invoke', async () => {
  await operation.invoke()

  expect(fixtures.bridges.transition.run).toBeCalled()
})

it('should pass io', async () => {
  await operation.invoke(fixtures.input)

  expect(fixtures.bridges.transition.run).toBeCalledWith(fixtures.input, expect.anything())
})

it('should pass target', async () => {
  await operation.invoke(fixtures.input, fixtures.query)

  expect(fixtures.target.query).toHaveBeenCalledWith(fixtures.query)

  expect(fixtures.bridges.transition.run)
    .toHaveBeenCalledWith(expect.anything(), fixtures.target.query.mock.results[0].value.get.mock.results[0].value)
})

it('should commit target after transition', async () => {
  await operation.invoke(fixtures.input, fixtures.query)

  expect(fixtures.target.commit).toHaveBeenCalledWith(fixtures.target.query.mock.results[0].value)
})

it('should not commit target after observation', async () => {
  await new Operation(fixtures.bridges.observation, fixtures.target).invoke(fixtures.input, fixtures.query)

  expect(fixtures.target.commit).not.toHaveBeenCalled()
})

it('should not commit target after error', async () => {
  await new Operation(fixtures.bridges.error, fixtures.target).invoke(fixtures.input, fixtures.query)

  expect(fixtures.target.commit).not.toHaveBeenCalled()
})

it('should handle object result', async () => {
  const [output, error] =
    await new Operation(fixtures.bridges.observation, fixtures.target).invoke(fixtures.input, fixtures.query)

  expect(output).toStrictEqual(fixtures.bridges.observation.run.mock.results[0].value)
  expect(error).toBeNull()
})

it('should handle [output, null] result', async () => {
  const [output, error] =
    await new Operation(fixtures.bridges.transition, fixtures.target).invoke(fixtures.input, fixtures.query)

  expect(output).toStrictEqual(fixtures.bridges.transition.run.mock.results[0].value[0])
  expect(error).toBeNull()
})

it('should handle [output, error] result', async () => {
  const [output, error] =
    await new Operation(fixtures.bridges.error, fixtures.target).invoke(fixtures.input, fixtures.query)

  expect(output).toBeNull()
  expect(error).toStrictEqual(fixtures.bridges.error.run.mock.results[0].value[1])
})

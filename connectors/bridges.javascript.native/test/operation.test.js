'use strict'

const { Connector } = require('@kookaburra/core')

const fixtures = require('./operation.fixtures')
const mock = fixtures.mock

jest.mock('../src/define/algorithm', () => ({ parse: mock.parse }))

const { Operation } = require('../src/operation')

const operations = {
  pong: require('./operations/pong'),
  errors: {
    object: require('./operations/error')
  },
  exception: require('./operations/exception')
}

beforeEach(() => {
  jest.clearAllMocks()
})

it('should inherit runtime.Connector', () => {
  expect(Operation.prototype).toBeInstanceOf(Connector)
})

it('should run algorithm', async () => {
  const operation = new Operation(__dirname, 'pong', 'observation')

  await operation.run({ input: 1 })

  expect(operations.pong).toHaveBeenCalled()
})

it('should pass input, state, context', async () => {
  const input = { a: 1 }
  const state = { b: 2 }
  const operation = new Operation(__dirname, 'pong', 'transition', fixtures.context)

  await operation.run(input, state)

  expect(operations.pong).toHaveBeenCalledWith(input, state, fixtures.context)
  expect(Object.isFrozen(operations.pong.mock.calls[0][1])).toBeFalsy()
})

it('should pass frozen state to observation', async () => {
  const input = { a: 1 }
  const state = { b: 2 }
  const operation = new Operation(__dirname, 'pong', 'observation', fixtures.context)

  await operation.run(input, state)

  expect(Object.isFrozen(operations.pong.mock.calls[0][1])).toBeTruthy()
})

it('should return output', async () => {
  const operation = new Operation(__dirname, 'pong', 'observation', fixtures.context)

  const reply = await operation.run()
  const result = await operations.pong.mock.results[0].value

  expect(reply).toBeDefined()
  expect(reply.output).toStrictEqual(result)
})

it('should return { output, error }', async () => {
  const operation = new Operation(__dirname, 'error', 'observation', fixtures.context)

  const { output, error } = await operation.run()

  expect(error).toStrictEqual({ code: 1, message: 'oops' })
  expect(output).toBeUndefined()
})

it('should throw on exceptions', async () => {
  const operation = new Operation(__dirname, 'exception', 'observation', fixtures.context)

  await expect(() => operation.run({ input: 1 })).rejects.toThrow(/oops/)
})

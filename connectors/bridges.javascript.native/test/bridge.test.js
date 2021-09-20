'use strict'

const path = require('path')

const { Connector } = require('@kookaburra/core')

const fixtures = require('./bridge.fixtures')
const mock = fixtures.mock

jest.mock('../src/bridge/parse', () => ({ parse: mock.parse }))

const { Bridge } = require('../src/bridge')

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
  expect(Bridge.prototype).toBeInstanceOf(Connector)
})

it('should run algorithm', async () => {
  const bridge = new Bridge({ name: 'pong' }, __dirname)

  await bridge.run({ input: 1 })

  expect(operations.pong).toHaveBeenCalled()
})

it('should pass input, state, context', async () => {
  const input = { a: 1 }
  const state = { b: 2 }
  const bridge = new Bridge({ name: 'pong' }, __dirname, fixtures.context)

  await bridge.run(input, state)

  expect(operations.pong).toHaveBeenCalledWith(input, state, fixtures.context)
  expect(Object.isFrozen(operations.pong.mock.calls[0][1])).toBeFalsy()
})

it('should pass frozen state to observation', async () => {
  const input = { a: 1 }
  const state = { b: 2 }
  const bridge = new Bridge({ name: 'pong', type: 'observation' }, __dirname, fixtures.context)

  await bridge.run(input, state)

  expect(Object.isFrozen(operations.pong.mock.calls[0][1])).toBeTruthy()
})

it('should return output', async () => {
  const bridge = new Bridge({ name: 'pong' }, __dirname, fixtures.context)

  const reply = await bridge.run()
  const result = await operations.pong.mock.results[0].value

  expect(reply).toBeDefined()
  expect(reply.output).toStrictEqual(result)
})

it('should return { output, error }', async () => {
  const bridge = new Bridge({ name: 'error' }, __dirname, fixtures.context)

  const { output, error } = await bridge.run()

  expect(error).toStrictEqual({ code: 1, message: 'oops' })
  expect(output).toBeUndefined()
})

it('should throw on exceptions', async () => {
  const bridge = new Bridge({ name: 'exception' }, __dirname, fixtures.context)

  await expect(() => bridge.run({ input: 1 })).rejects.toThrow(/oops/)
})

it('should provide declaration', async () => {
  const module = require.resolve('./operations/pong')
  const root = path.resolve(path.dirname(module), '..')
  const manifest = await Bridge.declaration(root, 'pong')

  expect(mock.parse).toHaveBeenCalledWith(operations.pong)
  expect(manifest).toStrictEqual(mock.parse.mock.results[0].value)
})

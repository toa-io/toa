'use strict'

const path = require('path')
const clone = require('clone-deep')

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
  const manifest = {
    '.bridge': { path: require.resolve('./operations/pong') }
  }

  const bridge = new Bridge(manifest)

  await bridge.run({ input: 1 })

  expect(operations.pong).toHaveBeenCalled()
})

it('should pass state', async () => {
  const manifest = {
    '.bridge': { path: require.resolve('./operations/pong') }
  }

  const io = { input: 1 }
  const state = { a: 1 }
  const bridge = new Bridge(manifest)

  await bridge.run(io, state)

  const argument = operations.pong.mock.calls[0][1]

  expect(argument).toStrictEqual(state)
  expect(Object.isFrozen(argument)).toBeFalsy()
})

it('should pass frozen state to observation', async () => {
  const manifest = {
    type: 'observation',
    '.bridge': { path: require.resolve('./operations/pong') }
  }

  const io = { input: 1 }
  const state = { a: 1 }
  const bridge = new Bridge(manifest)

  await bridge.run(io, state)

  const argument = operations.pong.mock.calls[0][1]

  expect(Object.isFrozen(argument)).toBeTruthy()
})

it('should pass id as getter', async () => {
  const manifest = {
    type: 'transition',
    '.bridge': { path: require.resolve('./operations/pong') }
  }

  const io = { input: 1 }
  const state = { a: 1 }
  const bridge = new Bridge(manifest)

  await bridge.run(io, state)

  const argument = operations.pong.mock.calls[0][1]

  expect(() => (argument.id = 'foo')).toThrow(/has only a getter/)
})

it('should pass entry with non enumerable system properties', async () => {
  const manifest = {
    '.bridge': { path: require.resolve('./operations/pong') }
  }

  const io = { input: 1 }
  const state = { a: 1, _version: 2 }
  const bridge = new Bridge(manifest)

  await bridge.run(io, clone(state))

  const argument = operations.pong.mock.calls[0][1]

  expect(argument).not.toStrictEqual(state)
  expect(argument._version).toBe(state._version)

  delete state._version

  expect(argument).toStrictEqual(state)
})

it('should pass set with non enumerable system properties', async () => {
  const manifest = {
    '.bridge': { path: require.resolve('./operations/pong') }
  }

  const io = { input: 1 }
  const state = [{ a: 1, _version: 2 }]
  const bridge = new Bridge(manifest)

  await bridge.run(io, clone(state))

  const argument = operations.pong.mock.calls[0][1]

  expect(argument).not.toStrictEqual(state)
  expect(argument[0]._version).toBe(state[0]._version)

  const expected = state.map(({ _version, ...rest }) => rest)

  expect(argument).toStrictEqual(expected)
})

it('should return output', async () => {
  const manifest = {
    '.bridge': { path: require.resolve('./operations/pong') }
  }

  const input = { a: 1 }
  const state = { a: 1 }
  const bridge = new Bridge(manifest)

  const output = await bridge.run(input, state)
  const result = await operations.pong.mock.results[0].value

  expect(output).toBeDefined()
  expect(output).toStrictEqual({ output: result })
})

it('should return { output, error }', async () => {
  const manifest = {
    '.bridge': { path: require.resolve('./operations/error') }
  }

  const input = { a: 1 }
  const bridge = new Bridge(manifest)

  const { output, error } = await bridge.run(input)

  expect(error).toStrictEqual({ code: 1, message: 'oops' })
  expect(output).toBeUndefined()
})

it('should throw on exceptions', async () => {
  const manifest = {
    '.bridge': { path: require.resolve('./operations/exception') }
  }

  const bridge = new Bridge(manifest)

  await expect(() => bridge.run({ input: 1 })).rejects.toThrow(/oops/)
})

it('should provide manifest', async () => {
  const module = require.resolve('./operations/pong')
  const root = path.resolve(path.dirname(module), '..')
  const manifest = await Bridge.manifest(root, 'pong')

  expect(mock.parse).toHaveBeenCalledWith(operations.pong)
  expect(manifest).toStrictEqual(mock.parse.mock.results[0].value)
  expect(manifest['.bridge']).toStrictEqual({ path: module })
})

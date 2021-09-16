'use strict'

const { Runtime } = require('../src/runtime')
const fixtures = require('./runtime.fixtures')

describe('Invocations', () => {
  const name = ['foo', 'bar'][Math.floor(2 * Math.random())]
  const invocation = fixtures.invocations[name]
  const runtime = new Runtime(fixtures.locator, fixtures.invocations)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should invoke', async () => {
    await runtime.invoke(name)

    expect(invocation.invoke).toBeCalled()
  })

  it('should throw on unknown invocation name', async () => {
    await expect(() => runtime.invoke('baz')).rejects.toThrow(/not found/)
  })

  it('should invoke input and query', async () => {
    const input = { test: Math.random() }
    const query = { test: Math.random() }
    await runtime.invoke(name, { input, query })

    expect(invocation.invoke).toBeCalledWith({ input, query })
  })

  it('should return io', async () => {
    const io = await runtime.invoke(name)

    expect(io).toBe(fixtures.invocations[name].invoke.mock.results[0].value)
  })
})

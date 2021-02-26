'use strict'

const { Runtime } = require('../src/runtime')
const assets = require('./runtime.assets')

describe('Invocations', () => {
  const name = ['foo', 'bar'][Math.floor(2 * Math.random())]
  const invocation = assets.invocations[name]
  const runtime = new Runtime(assets.locator, assets.invocations)

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

  it('should invoke with input', async () => {
    const input = { test: Math.random() }
    await runtime.invoke(name, input)

    expect(invocation.invoke).toBeCalledWith(expect.objectContaining({ input }))
  })

  it('should return io', async () => {
    const io = await runtime.invoke(name)

    expect(io.output.called).toBe(name)
  })
})

'use strict'

const { Runtime } = require('../src/runtime')
const assets = require('./runtime.assets')

describe('Invocations', () => {
  const invocation = assets.invocations[Math.floor(2 * Math.random())]
  const runtime = new Runtime(assets.invocations)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should invoke', async () => {
    await runtime.invoke(invocation.name)

    expect(invocation.invoke).toBeCalled()
  })

  it('should throw on unknown invocation name', async () => {
    await expect(() => runtime.invoke('baz')).rejects.toThrow(/not found/)
  })

  it('should return io', async () => {
    const io = await runtime.invoke(invocation.name)

    expect(io.output.called).toBe(invocation.name)
  })
})

import { jest } from '@jest/globals'

import Runtime from '../src/runtime'
import * as assets from './runtime.assets'

describe('Operations', () => {
  const operation = assets.operations[Math.floor(2 * Math.random())]
  const runtime = new Runtime(assets.operations)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should invoke operation', async () => {
    await runtime.invoke(operation.name)

    expect(operation.invoke).toBeCalled()
  })

  it('should throw on unknown operation', async () => {
    await expect(() => runtime.invoke('baz')).rejects.toThrow(/not found/)
  })

  it('should return io', async () => {
    const io = await runtime.invoke(operation.name)

    expect(io.output.called).toBe(operation.name)
  })
})

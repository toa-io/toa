'use strict'

const clone = require('clone-deep')

const { Invocation } = require('../src/invocation')
const assets = require('./invocation.assets')

let invocation

describe('invocation', () => {
  beforeEach(() => {
    invocation = new Invocation(assets.operation)

    jest.clearAllMocks()
  })

  it('should invoke operation', async () => {
    await invocation.invoke(assets.io.valid)

    expect(assets.operation.execute).toBeCalled()
  })

  it('should pass arguments', async () => {
    const foo = 'bar'
    const bar = 'foo'

    await invocation.invoke(assets.io.valid, foo, bar)

    expect(assets.operation.execute).toBeCalledWith(assets.io.valid, foo, bar)
  })

  it('should close input', async () => {
    await invocation.invoke(assets.io.valid)

    expect(assets.io.valid.close).toBeCalled()
  })
})

describe('validation', () => {
  beforeEach(() => {
    invocation = new Invocation(assets.operation, assets.schema)

    jest.clearAllMocks()
  })

  it('should write error on invalid input', async () => {
    const io = clone(assets.io.invalid)

    await invocation.invoke(io)

    expect(io.error).toBeInstanceOf(Error)
    expect(assets.operation.execute).not.toBeCalled()
  })
})

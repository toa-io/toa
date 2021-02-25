'use strict'

const clone = require('clone-deep')

const { Invocation } = require('../src/invocation')
const assets = require('./invocation.assets')

let invocation
let io

describe('invocation', () => {
  beforeEach(() => {
    invocation = new Invocation(assets.operation)
    io = clone(assets.io)

    jest.clearAllMocks()
  })

  it('should invoke operation', async () => {
    await invocation.invoke(io.valid)

    expect(assets.operation.execute).toBeCalled()
  })

  it('should pass arguments', async () => {
    const foo = 'bar'
    const bar = 'foo'

    await invocation.invoke(io.valid, foo, bar)

    expect(assets.operation.execute).toBeCalledWith(assets.io.valid, foo, bar)
  })

  it('should close input', async () => {
    await invocation.invoke(io.valid)

    expect(assets.io.valid.close).toBeCalled()
  })

  it('should freeze io', async () => {
    await invocation.invoke(io.valid)

    expect(assets.io.valid.freeze).toBeCalled()
  })
})

describe('validation', () => {
  beforeEach(() => {
    invocation = new Invocation(assets.operation, assets.schema)
    io = clone(assets.io)

    jest.clearAllMocks()
  })

  it('should write error on invalid input', async () => {
    await invocation.invoke(io.invalid)

    expect(io.invalid.error)
      .toMatchObject(expect.objectContaining({ name: 'validation', errors: expect.any(Array) }))

    expect(assets.operation.execute).not.toBeCalled()
  })

  it('should freeze io on invalid input', async () => {
    await invocation.invoke(io.invalid)

    expect(assets.io.invalid.freeze).toBeCalled()
  })
})

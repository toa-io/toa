'use strict'

const clone = require('clone-deep')

const { Invocation } = require('../src/invocation')
const fixtures = require('./invocation.fixtures')

let invocation
let io

describe('invocation', () => {
  beforeEach(() => {
    invocation = new Invocation(fixtures.operation)
    io = clone(fixtures.io)

    jest.clearAllMocks()
  })

  it('should invoke operation', async () => {
    await invocation.invoke(io.valid)

    expect(fixtures.operation.execute).toBeCalled()
  })

  it('should pass arguments', async () => {
    const foo = 'bar'
    const bar = 'foo'

    await invocation.invoke(io.valid, foo, bar)

    expect(fixtures.operation.execute).toBeCalledWith(fixtures.io.valid, foo, bar)
  })

  it('should close input', async () => {
    await invocation.invoke(io.valid)

    expect(fixtures.io.valid.close).toBeCalled()
  })

  it('should freeze io', async () => {
    await invocation.invoke(io.valid)

    expect(fixtures.io.valid.freeze).toBeCalled()
  })
})

describe('validation', () => {
  beforeEach(() => {
    invocation = new Invocation(fixtures.operation, fixtures.schema)
    io = clone(fixtures.io)

    jest.clearAllMocks()
  })

  it('should write error on invalid input', async () => {
    await invocation.invoke(io.invalid)

    expect(io.invalid.error)
      .toMatchObject(expect.objectContaining({ name: 'validation', errors: expect.any(Array) }))

    expect(fixtures.operation.execute).not.toBeCalled()
  })

  it('should freeze io on invalid input', async () => {
    await invocation.invoke(io.invalid)

    expect(fixtures.io.invalid.freeze).toBeCalled()
  })
})

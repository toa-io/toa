'use strict'

const { Invocation } = require('../src/invocation')
const fixtures = require('./invocation.fixtures')

let invocation

beforeEach(() => {
  jest.clearAllMocks()

  invocation = new Invocation(fixtures.operation, fixtures.io, fixtures.query)
})

describe('invocation', () => {
  it('should invoke operation', async () => {
    await invocation.invoke()

    expect(fixtures.operation.invoke).toHaveBeenCalled()
  })

  it('should pass io and query', async () => {
    const sample = fixtures.sample()

    await invocation.invoke(sample.input.ok, sample.query.ok)

    expect(fixtures.operation.invoke).toHaveBeenCalledWith(
      fixtures.io.create.mock.results[0].value.io,
      fixtures.query.parse.mock.results[0].value.query
    )
  })
})

describe('validation', () => {
  it('should not invoke if input is invalid', async () => {
    const sample = fixtures.sample()

    const io = await invocation.invoke(sample.input.invalid)

    expect(fixtures.operation.invoke).not.toHaveBeenCalled()
    expect(io.error).toEqual(fixtures.io.create.mock.results[0].value.oh)
  })

  it('should not invoke if query is invalid', async () => {
    const sample = fixtures.sample()

    const io = await invocation.invoke(sample.input.ok, sample.query.invalid)

    expect(fixtures.operation.invoke).not.toHaveBeenCalled()
    expect(io.error).toEqual(fixtures.query.parse.mock.results[0].value.oh)
  })
})

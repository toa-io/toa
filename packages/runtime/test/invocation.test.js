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
      fixtures.io.create.mock.results[0].value,
      fixtures.query.parse.mock.results[0].value
    )
  })
})

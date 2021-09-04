'use strict'

const { Invocation } = require('../src/invocation')
const fixtures = require('./invocation.fixtures')

let invocation

beforeEach(() => {
  jest.clearAllMocks()

  invocation = new Invocation(fixtures.call, fixtures.io, fixtures.query)
})

// TODO: unfinished

describe('invocation', () => {
  it('should invoke call', async () => {
    await invocation.invoke()

    expect(fixtures.call.invoke).toHaveBeenCalled()
  })

  it('should pass input and query', async () => {
    const sample = fixtures.sample()

    await invocation.invoke(sample.input.ok, sample.query.ok)

    expect(fixtures.call.invoke).toHaveBeenCalledWith(
      fixtures.io.create.mock.results[0].value.input,
      fixtures.query.parse.mock.results[0].value[0]
    )
  })
})

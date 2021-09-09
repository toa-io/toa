'use strict'

const { Call } = require('../src/call')
const fixtures = require('./call.fixtures')

let call

beforeEach(() => {
  jest.clearAllMocks()

  call = new Call(fixtures.transmission, fixtures.io, fixtures.query)
})

// TODO: unfinished

describe('invocation', () => {
  it('should invoke call', async () => {
    await call.invoke()

    expect(fixtures.transmission.request).toHaveBeenCalled()
  })

  it('should pass input and query', async () => {
    const sample = fixtures.sample()

    await call.invoke(sample.input.ok, sample.query.ok)

    expect(fixtures.transmission.request).toHaveBeenCalledWith(
      fixtures.io.create.mock.results[0].value.input,
      fixtures.query.parse.mock.results[0].value[0]
    )
  })
})

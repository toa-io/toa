'use strict'

const { Operation } = require('../src/operation')
const fixtures = require('./operation.fixtures')

let operation

beforeEach(() => {
  operation = new Operation(fixtures.algorithm)

  jest.clearAllMocks()
})

describe('Algorithm', () => {
  it('should execute', async () => {
    await operation.execute()

    expect(fixtures.algorithm.algorithm).toBeCalled()
  })

  it('should pass io', async () => {
    await operation.execute(fixtures.io)

    expect(fixtures.algorithm.algorithm).toBeCalledWith(fixtures.io)
  })
})

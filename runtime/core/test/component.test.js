'use strict'

const { Component } = require('../src/component')
const { codes } = require('../src/exceptions')
const fixtures = require('./component.fixtures')
const { AssertionError } = require('node:assert')

describe('Invocations', () => {
  const name = ['foo', 'bar'][Math.floor(2 * Math.random())]
  const invocation = fixtures.invocations[name]
  const component = new Component(fixtures.locator, fixtures.invocations)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should invoke', async () => {
    await component.invoke(name)

    expect(invocation.invoke).toBeCalled()
  })

  it('should throw on unknown invocation name', async () => {
    await expect(() => component.invoke('baz'))
      .rejects.toThrow(AssertionError)
  })

  it('should invoke input and query', async () => {
    const input = { test: Math.random() }
    const query = { test: Math.random() }
    await component.invoke(name, { input, query })

    expect(invocation.invoke).toBeCalledWith({ input, query })
  })

  it('should return io', async () => {
    const io = await component.invoke(name)

    expect(io).toBe(fixtures.invocations[name].invoke.mock.results[0].value)
  })
})

'use strict'

const fixtures = require('./context.fixtures')
const { Context } = require('../src/context')

/** @type {toa.core.Context} */
let context

beforeEach(() => {
  jest.clearAllMocks()

  context = new Context(fixtures.local, fixtures.discover, fixtures.extensions)
})

it('should expose extensions', () => {
  expect(context.extensions).toBeDefined()
  expect(context.extensions).toStrictEqual(fixtures.extensions)
})

describe('call', () => {
  it('should discover once', async () => {
    const request = {}

    context.call('a', 'b', 'c', request)
    context.call('a', 'b', 'c', request)

    expect(fixtures.discover).toHaveBeenCalledTimes(1)
  })
})

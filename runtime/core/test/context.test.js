'use strict'

const fixtures = require('./context.fixtures')
const { Context } = require('../src/context')

/** @type {toa.core.Context} */
let context

beforeEach(() => {
  jest.clearAllMocks()

  context = new Context(fixtures.local, fixtures.discover, fixtures.aspects)
})

it('should expose aspects', () => {
  expect(context.aspects).toBeDefined()
  expect(context.aspects).toStrictEqual(fixtures.aspects)
})

describe('call', () => {
  it('should discover once', async () => {
    const request = {}

    await context.call('a', 'b', 'c', request)
    await context.call('a', 'b', 'c', request)

    expect(fixtures.discover).toHaveBeenCalledTimes(1)
  })
})

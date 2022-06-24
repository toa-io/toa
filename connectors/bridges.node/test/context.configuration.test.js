'use strict'

const fixtures = require('./context.configuration.fixtures')
const { Context } = require('../src/context')

let context

beforeEach(() => {
  jest.clearAllMocks()

  context = new Context(/** @type {toa.core.Context} */ fixtures.context)
})

it('should expose extension', async () => {
  expect(context.extensions.configuration).toBeDefined()
})

it('should expose values', () => {
  expect(context.configuration).toStrictEqual(fixtures.configuration)
})

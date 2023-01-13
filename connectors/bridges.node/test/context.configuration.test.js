'use strict'

const fixtures = require('./context.configuration.fixtures')
const { Context } = require('../src/context')

let context

beforeEach(async () => {
  jest.clearAllMocks()

  context = new Context(fixtures.context)

  await context.connect()
})

it('should expose aspect', async () => {
  expect(context.aspects.configuration).toBeDefined()
})

it('should expose values', () => {
  expect(context.configuration).toStrictEqual(fixtures.configuration)
  expect(context.configuration.foo).toStrictEqual(fixtures.configuration.foo)
})

'use strict'

const fixtures = require('./context.configuration.fixtures')
const { Context } = require('../src/context')

let context

beforeEach(async () => {
  jest.clearAllMocks()

  context = new Context(fixtures.context)

  await context.connect()
})

it('should expose annex', async () => {
  expect(context.annexes.configuration).toBeDefined()
})

it('should expose values', () => {
  expect(context.configuration).toStrictEqual(fixtures.configuration)
})

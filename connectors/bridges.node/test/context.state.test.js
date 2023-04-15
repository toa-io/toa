'use strict'

const fixtures = require('./context.state.fixtures')
const { Context } = require('../src/context')
const { generate } = require('randomstring')

const state = fixtures.context.aspects[0]

/** @type {Context} */
let context

beforeEach(async () => {
  jest.clearAllMocks()

  context = new Context(fixtures.context)

  await context.connect()
})

it('should expose aspect', async () => {
  expect(context.aspects.state).toBeDefined()
})

it('should set value', async () => {
  context.state.a = 1

  expect(state.invoke).toHaveBeenCalledWith({ a: 1 })
})

it('should get value', async () => {
  const b = generate()

  state.invoke.mockImplementation(() => ({ a: { b } }))

  const value = context.state.a.b

  expect(value).toStrictEqual(b)

  state.invoke.mockClear()
})

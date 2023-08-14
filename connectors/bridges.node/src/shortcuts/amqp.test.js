'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')

const { aspect } = require('./.test/mock.aspect')
const { amqp } = require('./amqp')

it('should be', async () => {
  expect(amqp).toBeInstanceOf(Function)
})

/** @type {toa.node.Context} */
let context

beforeEach(() => {
  jest.clearAllMocks()

  context = /** @type {toa.node.Context} */ {}

  amqp(context, aspect)
})

it('should define shortcut', async () => {
  expect(context.amqp).toBeDefined()
})

it('should call invoke', async () => {
  const args = Array.from({ length: random(5) + 2 }, () => generate())

  await context.amqp.test.emit(...args)

  expect(aspect.invoke).toHaveBeenCalledWith('test', 'emit', ...args)
})

it('should throw if wrong amount of segments', async () => {
  await expect(context.amqp.one.two.emit()).rejects.toThrow('AMQP aspect call should have 2 segments [one, two, emit] given')
})

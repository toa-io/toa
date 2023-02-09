'use strict'

const { AssertionError } = require('node:assert')
const { generate } = require('randomstring')
const { gherkin } = require('@toa.io/libraries/mock')
const { io } = require('./io.mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)

require('../events')

/** @type {comq.features.Context} */
let context

beforeEach(() => {
  jest.clearAllMocks()

  context = { io }
})

describe('Given I consume events from {token} exchange as {token}', () => {
  const step = gherkin.steps.Gi('I consume events from {token} exchange as {token}')

  it('should be', async () => undefined)

  const exchange = generate()
  const group = generate()

  let consumer

  beforeEach(async () => {
    await step.call(context, exchange, group)

    consumer = io.consume.mock.calls[0]?.[2]

    expect(consumer).toBeInstanceOf(Function)
  })

  it('should consume', async () => {
    expect(io.consume).toHaveBeenCalledTimes(1)
  })

  it('should store event in context', async () => {
    const payload = generate()

    await consumer(payload)

    expect(context.consumed[group]).toStrictEqual(payload)
  })
})

describe('When I emit an event to the {token} exchange', () => {
  const step = gherkin.steps.Wh('I emit an event to the {token} exchange')

  it('should be', async () => undefined)

  const exchange = generate()

  beforeEach(async () => {
    await step.call(context, exchange)
  })

  it('should store event', async () => {
    expect(context.published).toBeDefined()
  })

  it('should emit event', async () => {
    expect(io.emit).toHaveBeenCalledWith(exchange, expect.anything())
  })
})

describe('Then {token} has received the event', () => {
  const step = gherkin.steps.Th('{token} has received the event')

  const payload = generate()
  const group = generate()

  beforeEach(() => {
    context.consumed = { [group]: payload }
  })

  it('should be', async () => undefined)

  it('should throw if not consumed', async () => {
    context.published = generate()

    await expect(step.call(context, group)).rejects.toThrow(AssertionError)
  })

  it('should pass if consumed', async () => {
    context.published = payload

    await expect(step.call(context, group)).resolves.not.toThrow()
  })
})

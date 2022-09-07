'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const generic = require('@toa.io/libraries/generic')
const { ReplayException } = require('../src/exceptions')

const fixtures = require('./context.fixtures')
const { Context } = require('../src/context')
const { Factory } = require('../')

const factory = new Factory()

/** @type {toa.core.Context} */
let context

/** @type {toa.sampling.sample.Context} */
let sample

/** @type {toa.core.Request} */
let request

const endpoint = 'do'

let input

it('should have factory', () => {
  expect(factory.context).toBeDefined()
})

beforeEach(() => {
  jest.clearAllMocks()

  context = factory.context(fixtures.context)
  input = generate()
  request = { input }

  sample = {
    local: {
      do: [
        {
          request: {
            input
          },
          reply: {
            output: generate()
          }
        }
      ]
    }
  }
})

it('should be', () => {
  expect(context).toBeDefined()
  expect(context).toBeInstanceOf(Context)
  expect(context).toBeInstanceOf(Connector)
})

it('should depends on original context', () => {
  expect(fixtures.context.link).toHaveBeenCalledWith(context)
})

it('should expose annexes', () => {
  expect(context.annexes).toStrictEqual(fixtures.context.annexes)
})

describe('apply', () => {
  it('should call origin if no sampling context', async () => {
    const reply = await context.apply(endpoint, request)

    await check(reply)
  })

  it('should throw on input mismatch', async () => {
    expect.assertions(1)

    const input = generate()
    const request = { input }
    const storage = generic.context('sampling')

    await storage.apply(sample, async () => {
      await expect(context.apply(endpoint, request)).rejects.toBeInstanceOf(ReplayException)
    })
  })

  it('should return sampled reply', async () => {
    expect.assertions(3)

    const input = sample.local.do[0].request.input
    const output = sample.local.do[0].reply.output
    const request = { input }
    const storage = generic.context('sampling')

    await storage.apply(sample, async () => {
      const reply = await context.apply(endpoint, request)

      expect(fixtures.context.apply).not.toHaveBeenCalled()
      expect(reply.output).toStrictEqual(output)
    })

    // used sample is removed
    expect(sample.local.do.length).toStrictEqual(0)
  })

  it('should call context if no sampled reply', async () => {
    expect.assertions(3)

    delete sample.local.do[0].reply

    const storage = generic.context('sampling')

    await storage.apply(sample, async () => {
      const reply = await context.apply(endpoint, request)

      await check(reply)
    })
  })

  const check = async (reply) => {
    expect(fixtures.context.apply).toHaveBeenCalled()
    expect(fixtures.context.apply).toHaveBeenCalledWith(endpoint, request)
    expect(reply).toStrictEqual(await fixtures.context.apply.mock.results[0].value)
  }
})

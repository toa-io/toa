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

/** @type {toa.sampling.Sample} */
let sample

/** @type {toa.core.Request} */
let request

it('should have factory', () => {
  expect(factory.context).toBeDefined()
})

beforeEach(() => {
  jest.clearAllMocks()

  sample = fixtures.sample()
  request = fixtures.request()
  context = factory.context(fixtures.context)
})

it('should be', () => {
  expect(context).toBeDefined()
  expect(context).toBeInstanceOf(Context)
  expect(context).toBeInstanceOf(Connector)
  expect(context.apply).toBeDefined()
  expect(context.call).toBeDefined()
})

it('should depends on original context', () => {
  expect(fixtures.context.link).toHaveBeenCalledWith(context)
})

it('should expose annexes', () => {
  expect(context.annexes).toStrictEqual(fixtures.context.annexes)
})

;['apply', 'call'].forEach((method) => {
  describe(method, () => {
    const group = method === 'apply' ? 'local' : 'remote'
    const endpoint = method === 'apply' ? 'do' : 'dummies.dummy.do'
    const segments = method === 'apply' ? [endpoint] : ['dummies', 'dummy', 'do']

    it(`should ${method} origin if no sampling context`, async () => {
      const reply = await context[method](...segments, request)

      await check(reply)
    })

    it('should throw on input mismatch', async () => {
      expect.assertions(1)

      const input = generate()
      const request = { input }
      const storage = generic.context('sampling')

      await storage.apply(sample, async () => {
        await expect(context[method](...segments, request)).rejects.toBeInstanceOf(ReplayException)
      })
    })

    it('should not throw if request sample is missing', async () => {
      expect.assertions(1)

      delete sample.context[group][endpoint][0].request

      const reply = sample.context[group][endpoint][0].reply
      const storage = generic.context('sampling')

      await storage.apply(sample, async () => {
        const output = await context[method](...segments, request)

        expect(output).toStrictEqual(reply)
      })
    })

    it('should return sampled reply', async () => {
      expect.assertions(3)

      const input = sample.context[group][endpoint][0].request.input
      const output = sample.context[group][endpoint][0].reply.output
      const request = { input }
      const storage = generic.context('sampling')

      await storage.apply(sample, async () => {
        const reply = await context[method](...segments, request)

        expect(fixtures.context[method]).not.toHaveBeenCalled()
        expect(reply.output).toStrictEqual(output)
      })

      // used sample is removed
      expect(sample.context[group][endpoint].length).toStrictEqual(0)
    })

    it(`should ${method} origin if no sampled reply`, async () => {
      expect.assertions(3)

      delete sample.context[group][endpoint][0].reply

      const storage = generic.context('sampling')

      await storage.apply(sample, async () => {
        const reply = await context[method](...segments, request)

        await check(reply)
      })
    })

    const check = async (reply, args) => {
      expect(fixtures.context[method]).toHaveBeenCalled()
      expect(fixtures.context[method]).toHaveBeenCalledWith(...segments, request)
      expect(reply).toStrictEqual(await fixtures.context[method].mock.results[0].value)
    }
  })
})

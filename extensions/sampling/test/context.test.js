'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const { random } = require('@toa.io/libraries/generic')

const { Context } = require('../src/context')
const { Aspect } = require('../src/aspect')
const { ReplayException, SampleException } = require('../src/exceptions')
const { context: storage } = require('../src/sample')

const fixtures = require('./context.fixtures')
const { Factory } = require('../')

const factory = new Factory()

/** @type {toa.core.Context} */
let context

/** @type {toa.sampling.Request} */
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

it('should depend on original context', () => {
  expect(fixtures.context.link).toHaveBeenCalledWith(context)
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

      await storage.apply(sample, async () => {
        await expect(context[method](...segments, request)).rejects.toBeInstanceOf(ReplayException)
      })
    })

    it('should not throw if request sample is missing', async () => {
      expect.assertions(1)

      delete sample.context[group][endpoint][0].request

      const reply = sample.context[group][endpoint][0].reply

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

      await storage.apply(sample, async () => {
        const reply = await context[method](...segments, request)

        await check(reply)
      })
    })

    if (method === 'call') {
      it('should throw on missing remote call within autonomous sample', async () => {
        const sample = { autonomous: true }

        await expect(storage.apply(sample, () => context[method](...segments, request)))
          .rejects.toBeInstanceOf(SampleException)
      })
    } else {
      it('should not throw on missing local call within autonomous sample', async () => {
        const sample = { autonomous: true }

        await expect(storage.apply(sample, () => context[method](...segments, request)))
          .resolves.not.toThrow()
      })
    }

    const check = async (reply) => {
      expect(fixtures.context[method]).toHaveBeenCalled()
      expect(fixtures.context[method]).toHaveBeenCalledWith(...segments, request)
      expect(reply).toStrictEqual(await fixtures.context[method].mock.results[0].value)
    }
  })
})

describe('aspects', () => {
  it('should expose aspects', () => {
    expect(context.aspects.length).toStrictEqual(fixtures.context.aspects.length)

    context.aspects.forEach((aspect) => {
      expect(aspect).toBeInstanceOf(Aspect)
    })
  })

  /** @type {toa.core.extensions.Aspect} */
  let aspect

  /** @type {jest.MockedObject<toa.core.extensions.Aspect>} */
  let fixture

  beforeEach(() => {
    const i = random(fixtures.context.aspects.length)

    aspect = context.aspects[i]
    fixture = /** @type {jest.MockedObject<toa.core.extensions.Aspect>} */ fixtures.context.aspects[i]
  })

  it('should expose name', async () => {
    expect(aspect.name).toStrictEqual(fixture.name)
  })

  it('should invoke if no sampling context', async () => {
    const args = [generate(), generate()]

    const output = await aspect.invoke(...args)

    expect(fixture.invoke).toHaveBeenCalledWith(...args)
    expect(output).toStrictEqual(await fixture.invoke.mock.results[0].value)
  })

  it('should throw on arguments mismatch', async () => {
    expect.assertions(1)

    const args = [generate(), generate()]

    /** @type {toa.sampling.Request} */
    const sample = {
      extensions: {
        [aspect.name]: [{ arguments: args }]
      }
    }

    await storage.apply(sample, async () => {
      const nope = [generate()]
      expect(() => aspect.invoke(...nope)).toThrow(ReplayException)
    })
  })

  it('should not throw on arguments match', async () => {
    const args = [generate(), generate()]

    /** @type {toa.sampling.Request} */
    const sample = {
      extensions: {
        [aspect.name]: [{ arguments: args }]
      }
    }

    const output = await storage.apply(sample, async () => {
      const yep = [...args, generate()]
      return aspect.invoke(...yep)
    })

    expect(output).toStrictEqual(await fixture.invoke.mock.results[0].value)
  })

  it('should return sampled result', async () => {
    const result = generate()

    /** @type {toa.sampling.Request} */
    const sample = {
      extensions: {
        [aspect.name]: [{ result }]
      }
    }

    const output = await storage.apply(sample, () => aspect.invoke())

    expect(output).toStrictEqual(result)
  })

  it('should remove used sample', async () => {
    const sample = {
      extensions: {
        [aspect.name]: [{ result: generate() }]
      }
    }

    await storage.apply(sample, () => aspect.invoke())

    expect(sample.extensions[aspect.name].length).toStrictEqual(0)
  })

  it('should not use permanent sample', async () => {
    const sample = {
      extensions: {
        [aspect.name]: [
          {
            result: generate(),
            permanent: true
          }
        ]
      }
    }

    await storage.apply(sample, () => aspect.invoke())

    expect(sample.extensions[aspect.name].length).toStrictEqual(1)
  })
})

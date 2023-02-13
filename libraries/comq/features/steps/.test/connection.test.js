'use strict'

const { AssertionError } = require('node:assert')
const { generate } = require('randomstring')
const { random, promise } = require('@toa.io/libraries/generic')
const { gherkin } = require('@toa.io/libraries/mock')
const { comq } = require('./connect.mock')
const world = require('./context.mock')
const mock = { gherkin, comq }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/libraries/comq', () => mock.comq)

require('../connection')

/** @type {comq.features.Context} */
let context

beforeEach(() => {
  jest.clearAllMocks()

  context = world.context()
})

describe('Given active connection to {url}', () => {
  const step = gherkin.steps.Gi('active connection to {url}')

  it('should be', async () => undefined)

  const url = generate()

  beforeEach(async () => {
    await step.call(context, url)
  })

  it('should connect', async () => {
    expect(context.connect).toHaveBeenCalledWith(url)
  })
})

describe('Given I\'m connecting to {url} for {number} second(s)', () => {
  const step = gherkin.steps.Gi('I\'m connecting to {url} for {number} second(s)')

  it('should be', async () => undefined)

  const url = generate()
  const interval = (random(2) + 1) / 10

  describe('broker available', () => {
    beforeEach(async () => {
      await step.call(context, url, interval)
    })

    it('should call connect', async () => {
      expect(context.connect).toHaveBeenCalledWith(url)
    })
  })

  describe('broker unavailable', () => {
    /** @type {toa.generic.promise.Exposed} */
    let connection

    beforeEach(() => {
      connection = promise()

      context.connect.mockImplementationOnce(async () => connection)
    })

    it('should quit after given interval', async () => {
      const start = new Date().getTime()

      await step.call(context, url, interval)

      const end = new Date().getTime()
      const inaccuracy = 1 // setTimeout is inaccurate

      expect(end - start + inaccuracy).toBeGreaterThanOrEqual(interval * 1000)
    })
  })

  describe('exceptions', () => {
    it('should catch exception', async () => {
      const exception = new Error(generate())

      context.connect.mockImplementationOnce(async () => { throw exception })

      await step.call(context, url, interval)

      expect(context.exception).toStrictEqual(exception)
    })
  })
})

describe.each([['', true], ['n\'t', false]])('Then the connection has%s been established', (not, defined) => {
  const step = gherkin.steps.Th(`the connection has${not} been established`)

  it('should be', async () => undefined)

  it(`should fail if io is${defined ? 'n\'t' : ''} defined`, async () => {
    context.io = defined ? undefined : generate()

    expect(() => step.call(context)).toThrow(AssertionError)
  })

  it(`should pass if io is${defined ? '' : 'n\'t'} defined`, async () => {
    context.io = defined ? generate() : undefined

    expect(() => step.call(context)).not.toThrow()
  })
})

describe('Then no exceptions have been thrown', () => {
  const step = gherkin.steps.Th('no exceptions have been thrown')

  it('should be', async () => undefined)

  it(`should fail if exception is defined`, async () => {
    context.exception = new Error()

    expect(() => step.call(context)).toThrow(AssertionError)
  })

  it(`should pass if io isn't defined`, async () => {
    expect(() => step.call(context)).not.toThrow()
  })
})

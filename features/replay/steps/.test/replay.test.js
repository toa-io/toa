'use strict'

const { join, resolve } = require('node:path')
const { generate } = require('randomstring')
const { flip } = require('@toa.io/generic')
const { directory: { glob } } = require('@toa.io/filesystem')
const { gherkin } = require('@toa.io/mock')

const fixtures = require('./replay.fixtures')

const mock = { gherkin, ...fixtures.mock }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/userland/samples', () => mock.samples)

require('../replay')

const COMPONENTS = resolve(__dirname, '../../../../userland/example/components')

/** @type {toa.samples.features.Context} */
let context

/** @type {string} */
let path

/** @type {boolean} */
let autonomous

beforeEach(() => {
  jest.clearAllMocks()

  const namespace = 'tea'
  const name = 'pots'
  const component = namespace + '.' + name

  path = join(COMPONENTS, component)
  autonomous = flip()
  context = { autonomous, component }
})

describe('When I replay it', () => {
  const step = gherkin.steps.Wh('I replay it')

  it('should be', () => undefined)

  describe('operation sample', () => {
    beforeEach(async () => {
      const endpoint = generate()
      const samples = [{ input: generate() }]

      context.operation = { endpoint, samples }
      delete context.ok

      await step.call(context)
    })

    it('should replay operation sample', async () => {
      /** @type {toa.samples.Suite} */
      const suite = {
        autonomous,
        operations: {
          [context.component]: {
            [context.operation.endpoint]: context.operation.samples
          }
        }
      }

      expect(mock.samples.replay).toHaveBeenCalledWith(suite, expect.arrayContaining([path]))
    })

    it('should write result to context', async () => {
      expect(context.ok).toStrictEqual(await mock.samples.replay.mock.results[0].value)
    })
  })

  describe('message sample', () => {
    beforeEach(async () => {
      const component = generate()
      const label = generate()
      const payload = { [generate()]: generate() }
      const input = generate()
      const query = { criteria: generate() }

      /** @type {toa.samples.Message} */
      const declaration = { component, payload, input, query }
      const samples = [declaration]

      context.message = { label, samples }
      delete context.ok

      await step.call(context)
    })

    it('should replay message sample', async () => {
      /** @type {toa.samples.Suite} */
      const suite = {
        autonomous,
        messages: {
          [context.message.label]: context.message.samples
        }
      }

      expect(mock.samples.replay).toHaveBeenCalledWith(suite, expect.arrayContaining([path]))
    })

    it('should write result to context', async () => {
      expect(context.ok).toStrictEqual(await mock.samples.replay.mock.results[0].value)
    })
  })
})

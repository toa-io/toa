'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')
const { gherkin } = require('@toa.io/libraries/mock')

const fixtures = require('./replay.fixtures')

const mock = { gherkin, ...fixtures.mock }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/userland/samples', () => mock.samples)
jest.mock('@toa.io/userland/stage', () => mock.stage)

require('../replay')

const root = resolve(__dirname, '../../../../userland/example/components')

/** @type {toa.samples.features.Context} */
let context

/** @type {string} */
let path

beforeEach(() => {
  jest.clearAllMocks()

  const namespace = 'tea'
  const name = 'pots'
  const component = namespace + '.' + name

  path = resolve(root, namespace, name)
  context = { component }
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

    it('should start composition', async () => {
      expect(mock.stage.composition).toHaveBeenCalledWith([path])
    })

    it('should replay operation sample', async () => {
      /** @type {toa.samples.Suite} */
      const suite = {
        autonomous: true,
        components: {
          [context.component]: {
            operations: {
              [context.operation.endpoint]: context.operation.samples
            }
          }
        }
      }

      expect(mock.samples.replay).toHaveBeenCalledWith(suite)
    })

    it('should write result to context', async () => {
      expect(context.ok).toStrictEqual(await mock.samples.replay.mock.results[0].value)
    })

    it('should shutdown stage', async () => {
      expect(mock.stage.shutdown).toHaveBeenCalled()
    })
  })

  describe('message sample', () => {
    beforeEach(async () => {
      const label = generate()
      const payload = { [generate()]: generate() }
      const input = generate()
      const query = { criteria: generate() }

      /** @type {toa.samples.Message} */
      const declaration = { payload, input, query }
      const samples = [declaration]

      context.message = { label, samples }
      delete context.ok

      await step.call(context)
    })

    it('should replay message sample', async () => {
      /** @type {toa.samples.Suite} */
      const suite = {
        autonomous: true,
        components: {
          [context.component]: {
            messages: {
              [context.message.label]: context.message.samples
            }
          }
        }
      }

      expect(mock.samples.replay).toHaveBeenCalledWith(suite)
    })

    it('should write result to context', async () => {
      expect(context.ok).toStrictEqual(await mock.samples.replay.mock.results[0].value)
    })
  })
})

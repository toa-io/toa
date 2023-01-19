'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')
const { gherkin } = require('@toa.io/libraries/mock')

const fixtures = require('./replay.fixtures')

const mock = {
  gherkin,
  samples: fixtures.mock.samples,
  stage: fixtures.mock.stage
}

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
      const sample = /** @type {toa.samples.operations.Declaration} */ context.operation.samples[0]

      /** @type {toa.samples.Suite} */
      const suite = {
        autonomous: true,
        components: {
          [context.component]: {
            operations: {
              [context.operation.endpoint]: [{ request: { input: sample.input } }]
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
})

'use strict'

const { resolve } = require('node:path')
const clone = require('clone-deep')

const { stage } = require('./stage.mock')
const { translate } = require('./replay.translate.mock')
const mock = { stage, translate }

jest.mock('@toa.io/userland/stage', () => mock.stage)
jest.mock('../src/.replay/.suite/translate', () => mock.translate)

const fixtures = require('./replay.fixtures')
const { replay } = require('../src')

it('should be', () => {
  expect(replay).toBeDefined()
})

let ok

/** @type {toa.samples.Suite} */
let suite

const path = resolve(__dirname, '../../example/components/math/calculations')
const paths = [path]

beforeEach(async () => {
  jest.clearAllMocks()

  suite = clone(fixtures.suite)
  ok = await replay(suite, paths)
})

it('should boot composition', () => {
  expect(stage.composition).toHaveBeenCalled()
  expect(stage.composition).toHaveBeenCalledWith(paths)
})

it('should invoke operations with translated samples', async () => {
  const translation = (declaration) => {
    const find = (call) => call[0].input === declaration.input
    const index = mock.translate.operation.mock.calls.findIndex(find)

    return mock.translate.operation.mock.results[index].value
  }

  /**
   * @param {string} component
   * @return {Promise<jest.MockedObject<toa.core.Component>>}
   */
  const find = async (component) => {
    for (let n = 0; n < stage.remote.mock.calls.length; n++) {
      const call = stage.remote.mock.calls[n]

      if (call[0] === component) return stage.remote.mock.results[n].value
    }

    throw new Error(`Remote ${component} hasn't been connected`)
  }

  for (const [id, set] of Object.entries(fixtures.suite.operations)) {
    const remote = await find(id)

    for (const [endpoint, samples] of Object.entries(set)) {
      for (const sample of samples) {
        const request = translation(sample)

        expect(remote.invoke).toHaveBeenCalledWith(endpoint, request)
      }
    }
  }
})

it('should emit translated messages', async () => {
  /**
   * @param {toa.samples.Message} declaration
   * @param {string} id
   * @returns {{index: number, message: toa.sampling.Message}}
   */
  const translation = (declaration) => {
    const find = (call) => call[0].payload === declaration.payload
    const index = mock.translate.message.mock.calls.findIndex(find)
    const message = mock.translate.message.mock.results[index].value
    const call = mock.translate.message.mock.calls[index]

    expect(call[1]).toStrictEqual(fixtures.suite.autonomous)

    return { index, message }
  }

  for (const [label, samples] of Object.entries(fixtures.suite.messages)) {
    for (const sample of samples) {
      const { index, message } = translation(sample)

      expect(stage.binding.binding.emit)
        .toHaveBeenNthCalledWith(index + 1, label, message)
    }
  }
})

it('should shutdown stage', () => {
  expect(stage.shutdown).toHaveBeenCalled()
})

it('should return results', () => {
  expect(ok).toStrictEqual(true)
})

it.each(['messages', 'operations'])('should not throw if no %s defined', async (key) => {
  delete suite[key]

  ok = await replay(suite, paths)

  expect(ok).toStrictEqual(true)
})

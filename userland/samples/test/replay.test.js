'use strict'

const { resolve } = require('node:path')
const clone = require('clone-deep')

const { stage } = require('./stage.mock')
const { translate } = require('./replay.translate.mock')
const mock = { stage, translate }

jest.mock('@toa.io/userland/stage', () => mock.stage)
jest.mock('../src/.replay/translate', () => mock.translate)

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

it('should connect remotes', () => {
  const { components } = suite
  const ids = Object.keys(components)

  expect(ids.length).toBeGreaterThan(0)
  expect(stage.remote).toHaveBeenCalledTimes(ids.length)

  let n = 0

  for (const id of ids) {
    n++

    expect(stage.remote).toHaveBeenNthCalledWith(n, id)
  }
})

it('should invoke operations with translated samples', async () => {
  const translation = (declaration) => {
    const find = (call) => call[0].input === declaration.input
    const index = mock.translate.operation.mock.calls.findIndex(find)
    const request = mock.translate.operation.mock.results[index].value

    return { index, request }
  }

  /**
   * @param {string} component
   * @return {Promise<jest.MockedObject<toa.core.Component>>}
   */
  const find = async (component) => {
    for (let n = 0; n < stage.remote.mock.calls.length; n++) {
      const call = stage.remote.mock.calls[n]

      if (call[0] === component) return await stage.remote.mock.results[n].value
    }

    throw new Error(`Remote ${component} hasn't been connected`)
  }

  for (const [id, component] of Object.entries(fixtures.suite.components)) {
    const remote = await find(id)

    for (const [endpoint, declarations] of Object.entries(component.operations)) {
      for (const declaration of declarations) {
        const { index, request } = translation(declaration)

        expect(index).toBeGreaterThan(-1)
        expect(remote.invoke).toHaveBeenNthCalledWith(index + 1, endpoint, request)
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
  const translation = (declaration, id) => {
    const find = (call) => call[0].payload === declaration.payload
    const index = mock.translate.message.mock.calls.findIndex(find)
    const message = mock.translate.message.mock.results[index].value
    const translation = mock.translate.message.mock.calls[index]

    const [, autonomous, component] = translation

    expect(autonomous).toStrictEqual(fixtures.suite.autonomous)
    expect(component).toStrictEqual(id)

    return { index, message }
  }

  for (const [id, component] of Object.entries(fixtures.suite.components)) {
    for (const [label, declarations] of Object.entries(component.messages)) {
      for (const declaration of declarations) {
        const { index, message } = translation(declaration, id)

        expect(stage.binding.binding.emit)
          .toHaveBeenNthCalledWith(index + 1, label, message)
      }
    }
  }
})

it('should shutdown stage', () => {
  expect(stage.shutdown).toHaveBeenCalled()
})

it('should return results', () => {
  expect(ok).toStrictEqual(true)
})

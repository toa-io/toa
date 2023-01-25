'use strict'

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

beforeEach(async () => {
  jest.clearAllMocks()

  suite = clone(fixtures.suite)
  ok = await replay(suite)
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

it('should return results', () => {
  expect(ok).toStrictEqual(true)
})

'use strict'

const { stage } = require('./stage.mock')
const mock = { stage }

jest.mock('@toa.io/userland/stage', () => mock.stage)

const fixtures = require('./replay.fixtures')
const { replay } = require('../src')

it('should be', () => {
  expect(replay).toBeDefined()
})

let ok

beforeAll(async () => {
  ok = await replay(fixtures.suite)
})

it('should connect remotes', () => {
  const components = Object.keys(fixtures.suite)

  expect(components.length).toBeGreaterThan(0)
  expect(stage.remote).toHaveBeenCalledTimes(components.length)

  let n = 0

  for (const component of components) {
    n++

    expect(stage.remote).toHaveBeenNthCalledWith(n, component)
  }
})

it('should replay samples', async () => {
  for (const [component, set] of Object.entries(fixtures.suite)) {
    const remote = await find(component)

    for (const [operation, samples] of Object.entries(set)) {
      for (const sample of samples) {
        const { request, reply } = sample

        request.sample = { reply }

        expect(remote.invoke).toHaveBeenCalledWith(operation, request)
      }
    }
  }
})

it('should return results', () => {
  expect(ok).toStrictEqual(true)
})

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

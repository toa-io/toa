'use strict'

const { Binding } = require('../src/binding')
const assets = require('./binding.assets')

const { Connector } = require('@kookaburra/runtime')

const mock = assets.mock

jest.mock('../src/binding/verb', () => ({ verb: () => mock.verb() }))
jest.mock('../src/binding/route', () => ({ route: () => mock.route() }))

let binding

beforeEach(() => {
  binding = new Binding(assets.server)
})

it('should be Connector', () => {
  expect(binding).toBeInstanceOf(Connector)
})

it('should bind', () => {
  binding.bind(assets.runtime, assets.operations)

  expect(assets.server.bind).toHaveBeenCalledTimes(Object.keys(assets.operations).length)

  Object.keys(assets.operations).forEach(([name, operation], i) => {
    expect(assets.server.bind).toHaveBeenNthCalledWith(i + 1,
      mock.verb.mock.results[i].value,
      mock.route.mock.results[i].value,
      expect.any(Function)
    )
  })
})

it('should start server', async () => {
  await binding.connect()

  expect(assets.server.listen).toHaveBeenCalled()
})

it('should stop server', async () => {
  await binding.disconnect()

  expect(assets.server.close).toHaveBeenCalled()
})

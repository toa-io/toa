'use strict'

const { Binding } = require('../src/binding')
const assets = require('./binding.assets')

const { Connector } = require('@kookaburra/runtime')

let binding

beforeEach(() => {
  binding = new Binding(assets.server)

  jest.resetAllMocks()
})

it('should be Connector', () => {
  expect(binding).toBeInstanceOf(Connector)
})

it('should bind', () => {
  binding.bind(assets.runtime, assets.operations)

  expect(assets.server.bind).toHaveBeenCalledTimes(Object.keys(assets.operations).length)
})

it('should start server', async () => {
  await binding.connect()

  expect(assets.server.listen).toHaveBeenCalled()
})

it('should stop server', async () => {
  await binding.disconnect()

  expect(assets.server.close).toHaveBeenCalled()
})

it('should throw on binding conflict', async () => {
  const bind = async () => await binding.bind(assets.runtime, assets.conflict.operations)

  await expect(bind).rejects.toThrow(/conflicts with/)
})

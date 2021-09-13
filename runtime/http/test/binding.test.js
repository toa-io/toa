'use strict'

const { Binding } = require('../src/binding')
const fixtures = require('./binding.fixtures')

const { Connector } = require('@kookaburra/core')

let binding

beforeEach(() => {
  binding = new Binding(fixtures.server)

  jest.resetAllMocks()
})

it('should be Connector', () => {
  expect(binding).toBeInstanceOf(Connector)
})

it('should bind', () => {
  binding.bind(fixtures.runtime, fixtures.operations)

  expect(fixtures.server.bind).toHaveBeenCalledTimes(Object.keys(fixtures.operations).length)
})

it('should start server', async () => {
  await binding.connect()

  expect(fixtures.server.listen).toHaveBeenCalled()
})

it('should stop server', async () => {
  await binding.disconnect()

  expect(fixtures.server.close).toHaveBeenCalled()
})

it('should throw on binding conflict', async () => {
  const bind = async () => await binding.bind(fixtures.runtime, fixtures.conflict.operations)

  await expect(bind).rejects.toThrow(/conflicts with/)
})

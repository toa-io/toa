'use strict'

const { encode } = require('@toa.io/generic')

const fixtures = require('./factory.fixtures')
const mock = fixtures.mock

jest.mock('../src/storage', () => ({ Storage: mock.Storage }))
jest.mock('../src/connection', () => ({ Connection: mock.Connection }))

const { Factory } = require('../src/')

/** @type {toa.core.storages.Factory} */
let factory

const uris = { default: 'mongodb://whatever' }
const value = encode(uris)

process.env.TOA_STORAGES_MONGODB_POINTER = value

beforeEach(() => {
  factory = new Factory()
})

it('should create url', () => {
  factory.storage(fixtures.locator)

  expect(mock.Connection).toHaveBeenCalled()

  const instance = mock.Connection.mock.instances[0]
  /** @type {toa.mongodb.Pointer} */
  const pointer = mock.Connection.mock.calls[0][0]

  expect(mock.Storage).toHaveBeenLastCalledWith(instance)

  expect(pointer).toBeDefined()
})

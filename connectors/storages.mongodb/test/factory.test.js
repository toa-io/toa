'use strict'

const fixtures = require('./factory.fixtures')
const mock = fixtures.mock

jest.mock('../src/storage', () => ({ Storage: mock.Storage }))
jest.mock('../src/connection', () => ({ Connection: mock.Connection }))

const { Factory } = require('../src/')

/** @type {toa.core.storages.Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

it('should create url', () => {
  factory.storage(fixtures.locator)

  expect(mock.Connection).toHaveBeenCalled()

  const instance = mock.Connection.mock.instances[0]
  /** @type {toa.storages.mongo.Locator} */
  const locator = mock.Connection.mock.calls[0][0]

  expect(mock.Storage).toHaveBeenLastCalledWith(instance)

  expect(locator).toBeDefined()
  expect(locator).toBeInstanceOf(URL)

  expect(locator.protocol).toStrictEqual('mongodb:')

  if (process.env.TOA_ENV !== 'local') {
    expect(fixtures.locator.hostname).toHaveBeenLastCalledWith('storages-mongodb')
    expect(locator.hostname).toStrictEqual(fixtures.locator.hostname.mock.results[0].value)
  }
})

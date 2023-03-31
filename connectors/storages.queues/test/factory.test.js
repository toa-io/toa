'use strict'

const { generate } = require('randomstring')

const mock = require('./amqp.mock')

jest.mock('@toa.io/generics.amqp', () => mock)
jest.mock('../source/storage')

const {
  /** @type {jest.MockedFunction<connector>} */
  connector
} = require('@toa.io/generics.amqp')

const {
  /** @type {jest.MockedClass<Storage>} */
  Storage
} = require('../source/storage')

const { Factory } = require('../')

it('should be', async () => {
  expect(Factory).toBeDefined()
})

/** @type {toa.core.storages.Factory} */
let factory

beforeEach(() => {
  jest.clearAllMocks()

  factory = new Factory()
})

describe('storage', () => {
  let storage
  let locator

  /** @type {toa.queues.Properties} */
  let properties

  beforeEach(() => {
    const namespace = generate()
    const name = generate()

    locator = /** @type {toa.core.Locator} */ { name, namespace }
    properties = { exchange: generate() }
    storage = factory.storage(locator, properties)
  })

  it('should be', async () => {
    expect(factory.storage).toBeDefined()
  })

  it('should create an instance of Connector', async () => {
    expect(connector).toHaveBeenCalledWith('storages-queues-amqp', locator)
  })

  it('should return an instance of Storage', async () => {
    const comm = connector.mock.results[0].value

    expect(Storage).toHaveBeenCalledWith(comm, properties)
    expect(storage).toStrictEqual(Storage.mock.instances[0])
  })

  it('should normalize properties', async () => {
    jest.clearAllMocks()

    properties = generate()
    storage = factory.storage(locator, properties)

    expect(Storage).toHaveBeenCalledWith(expect.anything(), { exchange: properties })
  })
})

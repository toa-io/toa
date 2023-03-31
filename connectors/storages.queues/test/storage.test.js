'use strict'

const { Storage } = require('../source/storage')

const { connector } = require('./amqp.mock')
const { generate } = require('randomstring')

it('should be', async () => {
  expect(Storage).toBeInstanceOf(Function)
})

/** @type {toa.amqp.Communication} */
let comm

/** @type {toa.core.Storage} */
let storage

/** @type {toa.queues.Properties} */
let properties

beforeEach(() => {
  comm = connector()
  properties = { exchange: generate() }

  storage = new Storage(comm, properties)
})

it('should depend on Communication', async () => {
  expect(comm.link).toHaveBeenCalledWith(storage)
})

describe('store', () => {
  it('should be', async () => {
    expect(storage.store).toBeInstanceOf(Function)
  })

  it('should publish a message', async () => {
    /** @type {toa.core.storages.Record} */
    const record = { id: generate(), _version: 0 }

    await storage.store(record)

    expect(comm.emit).toHaveBeenCalledWith(properties.exchange, record)
  })
})

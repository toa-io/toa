'use strict'

const { generate } = require('randomstring')
const { newid, random } = require('@toa.io/libraries/generic')

const fixtures = require('./storage.fixtures')

const { Storage } = require('../src/storage')

it('should be', () => {
  expect(Storage).toBeDefined()
})

/** @type {toa.sql.Client} */
let client

/** @type {toa.sql.Storage} */
let storage

beforeEach(async () => {
  client = new fixtures.Client()
  storage = new Storage(client)

  await storage.connect()
})

it('should depend on connection', () => {
  expect(client.link).toHaveBeenCalledWith(storage)
})

describe('store', () => {
  it('should insert new entity', async () => {
    /** @type {toa.core.storages.Entity} */
    const entity = { id: newid(), _version: 0, foo: random(), bar: generate() }

    const result = await storage.store(entity)

    const argument = { ...entity, _version: 1 }

    expect(client.insert).toHaveBeenCalledWith(argument)
    expect(result).toStrictEqual(true)
  })

  it('should update existing entity', async () => {
    /** @type {toa.core.storages.Entity} */
    const entity = { id: newid(), _version: 1, foo: random(), bar: generate() }

    const result = await storage.store(entity)

    const criteria = { id: entity.id, _version: entity._version }
    const object = { ...entity, _version: 2 }

    expect(client.update).toHaveBeenCalledWith(criteria, object)
    expect(result).toStrictEqual(false)
  })
})

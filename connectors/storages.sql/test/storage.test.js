'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { generate } = require('randomstring')
const { newid, random } = require('@toa.io/generic')

const fixtures = require('./storage.fixtures')

const { Storage } = require('../src/storage')

it('should be', () => {
  assert.notStrictEqual(Storage, undefined)
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
  assert.ok(client.link.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], storage)))
})

describe('store', () => {
  it('should insert new entity', async () => {
    /** @type {toa.core.storages.Record} */
    const entity = { id: newid(), _version: 1, foo: random(), bar: generate() }

    const result = await storage.store(entity)

    assert.ok(client.insert.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], entity)))
    assert.deepStrictEqual(result, true)
  })

  it('should update existing entity', async () => {
    /** @type {toa.core.storages.Record} */
    const entity = { id: newid(), _version: 2, foo: random(), bar: generate() }

    const result = await storage.store(entity)

    const criteria = { id: entity.id, _version: entity._version - 1 }

    assert.ok(client.update.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], criteria) && isDeepStrictEqual(call.arguments[1], entity)))
    assert.deepStrictEqual(result, false)
  })
})

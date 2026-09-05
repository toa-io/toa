import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { newid, random } from '@toa.io/generic'

import * as fixtures from './storage.fixtures.js'

import { Storage } from '../src/storage.js'

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
    /** @type {import('@toa.io/core/types').storages.Record} */
    const entity = { id: newid(), _version: 1, foo: random(), bar: generate() }

    const result = await storage.store(entity)

    assert.ok(client.insert.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], entity)))
    assert.deepStrictEqual(result, true)
  })

  it('should update existing entity', async () => {
    /** @type {import('@toa.io/core/types').storages.Record} */
    const entity = { id: newid(), _version: 2, foo: random(), bar: generate() }

    const result = await storage.store(entity)

    const criteria = { id: entity.id, _version: entity._version - 1 }

    assert.ok(client.update.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], criteria) && isDeepStrictEqual(call.arguments[1], entity)))
    assert.deepStrictEqual(result, false)
  })
})

import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { Storage } from '../src/storage.js'

let collection
let storage

beforeEach(async () => {
  collection = {
    collectionName: 'test',
    findOne: mock.fn(async () => null),
    find: mock.fn(() => ({ stream: () => null }))
  }

  const client = {
    collection,
    link: () => null
  }

  storage = new Storage(client, { schema: { properties: {} } })

  await storage.open()
})

describe('get', () => {
  it('should filter deleted', async () => {
    await storage.get({})

    assert.ok(collection.findOne.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], { _deleted: null }) && isDeepStrictEqual(call.arguments[1], {})))
  })

  it('should filter deleted with sort', async () => {
    await storage.get({ options: { sort: [['_created', 'desc']] } })

    assert.ok(collection.findOne.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], { _deleted: null }) && isDeepStrictEqual(call.arguments[1], { sort: [['_created', -1]] })))
  })

  it('should not filter deleted if queried by id', async () => {
    const id = 'bcb6780f50e243348cad40ed6b5ef575'

    await storage.get({ id })

    assert.ok(collection.findOne.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], { _id: id }) && isDeepStrictEqual(call.arguments[1], {})))
  })

  it('should not filter deleted if requested', async () => {
    await storage.get({ options: { deleted: true } })

    assert.ok(collection.findOne.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], {}) && isDeepStrictEqual(call.arguments[1], {})))
  })
})

describe('stream', () => {
  it('should filter deleted', async () => {
    await storage.stream()

    assert.ok(collection.find.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], { _deleted: null }) && isDeepStrictEqual(call.arguments[1], {})))
  })

  it('should filter deleted with sort', async () => {
    await storage.stream({ options: { sort: [['_created', 'desc']] } })

    assert.ok(collection.find.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], { _deleted: null }) && isDeepStrictEqual(call.arguments[1], { sort: [['_created', -1]] })))
  })

  it('should not filter deleted if requested', async () => {
    await storage.stream({ options: { deleted: true } })

    assert.ok(collection.find.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], {}) && isDeepStrictEqual(call.arguments[1], {})))
  })
})

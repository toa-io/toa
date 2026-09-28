import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { Storage } from '../src/storage.js'

let collection
let db
let storage

beforeEach(async () => {
  collection = {
    collectionName: 'test',
    findOne: mock.fn(async () => null),
    find: mock.fn(() => cursor()),
    updateMany: mock.fn(async () => ({ modifiedCount: 0 })),
    updateOne: mock.fn(async () => ({ upsertedCount: 0, modifiedCount: 0 }))
  }

  db = { collection: mock.fn(() => null) }

  const session = { endSession: async () => undefined }
  const instance = { client: { startSession: () => session } }
  const client = { collection, db, instance, link: () => null }

  storage = new Storage(client, { schema: { properties: {} } })

  await storage.open()
})

function cursor(records = []) {
  return {
    hasNext: async () => records.length > 0,
    close: async () => undefined,
    async *[Symbol.asyncIterator]() {
      yield* records
    }
  }
}

describe('open', () => {
  it('should not touch the migrations record where the entity declares none', () => {
    assert.equal(db.collection.mock.callCount(), 0)
  })
})

describe('get', () => {
  it('should filter deleted', async () => {
    await storage.get({})

    assert.ok(
      collection.findOne.mock.calls.some(
        (call) =>
          call.arguments.length === 2 &&
          isDeepStrictEqual(call.arguments[0], { DELETED: null }) &&
          isDeepStrictEqual(call.arguments[1], {})
      )
    )
  })

  it('should filter deleted with sort', async () => {
    await storage.get({ options: { sort: [['CREATED', 'desc']] } })

    assert.ok(
      collection.findOne.mock.calls.some(
        (call) =>
          call.arguments.length === 2 &&
          isDeepStrictEqual(call.arguments[0], { DELETED: null }) &&
          isDeepStrictEqual(call.arguments[1], { sort: [['CREATED', -1]] })
      )
    )
  })

  it('should not filter deleted if queried by id', async () => {
    const id = 'bcb6780f50e243348cad40ed6b5ef575'

    await storage.get({ id })

    assert.ok(
      collection.findOne.mock.calls.some(
        (call) =>
          call.arguments.length === 2 &&
          isDeepStrictEqual(call.arguments[0], { _id: id }) &&
          isDeepStrictEqual(call.arguments[1], {})
      )
    )
  })

  it('should not filter deleted if requested', async () => {
    await storage.get({ options: { deleted: true } })

    assert.ok(
      collection.findOne.mock.calls.some(
        (call) =>
          call.arguments.length === 2 &&
          isDeepStrictEqual(call.arguments[0], {}) &&
          isDeepStrictEqual(call.arguments[1], {})
      )
    )
  })
})

describe('stream', () => {
  const read = () => collection.find.mock.calls[0].arguments

  it('should filter deleted', async () => {
    await storage.stream()

    assert.deepStrictEqual(read()[0], { DELETED: null })
  })

  it('should filter deleted with sort', async () => {
    await storage.stream({ options: { sort: [['CREATED', 'desc']] } })

    assert.deepStrictEqual(read()[0], { DELETED: null })
    assert.deepStrictEqual(read()[1].sort, [['CREATED', -1]])
  })

  it('should not filter deleted if requested', async () => {
    await storage.stream({ options: { deleted: true } })

    assert.deepStrictEqual(read()[0], {})
  })

  it('should read what the majority of the replica set holds', async () => {
    await storage.stream()

    assert.deepStrictEqual(read()[1].readConcern, { level: 'majority' })
  })

  it('should end the set with no position where the storage keeps no history', async () => {
    const stream = await storage.stream()
    const parts = await stream.toArray()

    assert.deepStrictEqual(parts, [{ token: null }])
  })

  it('should read a page ordered by id', async () => {
    await storage.stream({ options: { limit: 2 } })

    assert.deepStrictEqual(read()[1].sort, [['_id', 1]])
    assert.equal(read()[1].limit, 2)
  })

  it('should read a page newest first, and by id where entries share a time', async () => {
    await storage.stream({ options: { limit: 2, sort: [['CREATED', 'desc']] } })

    assert.deepStrictEqual(read()[1].sort, [['CREATED', -1], ['_id', -1]])
  })

  it('should refuse a page ordered by what an entry changes', async () => {
    await assert.rejects(
      storage.stream({ options: { limit: 2, sort: [['title', 'asc']] } }),
      (error) => error.code === 221
    )
  })

  it('should end a page it was told to stop at with no page token', async () => {
    const found = [
      { _id: 'a', CREATED: new Date(2), VERSION: 1 },
      { _id: 'b', CREATED: new Date(1), VERSION: 1 }
    ]

    collection.find.mock.mockImplementationOnce(() => cursor(found))

    const stream = await storage.stream({ options: { limit: 2, stop: true } })
    const parts = await stream.toArray()

    assert.deepStrictEqual(parts.at(-1), { token: null })
  })
})

describe('converge', () => {
  const record = { id: 'a1', VERSION: 4, REGION: 1, status: 'paid' }

  const call = () => collection.updateOne.mock.calls[0].arguments

  it('should select by id alone, so that what is absent is upserted', async () => {
    await storage.converge(record)

    const [criteria, , options] = call()

    assert.deepEqual(criteria, { _id: 'a1' })
    assert.equal(options.upsert, true)
  })

  it('should supersede a lower version', async () => {
    await storage.converge(record)

    const [, pipeline] = call()
    const [older] = pipeline[0].$replaceWith.$cond[0].$or

    assert.deepEqual(older, { $lt: [{ $ifNull: ['$VERSION', 0] }, 4] })
  })

  it('should supersede an equal version written by an outranked region', async () => {
    await storage.converge(record)

    const [, pipeline] = call()
    const [, tied] = pipeline[0].$replaceWith.$cond[0].$or

    assert.deepEqual(tied.$and, [
      { $eq: ['$VERSION', 4] },
      { $gt: [{ $ifNull: ['$REGION', 0] }, 1] }
    ])
  })

  it('should leave what is stored where it does not', async () => {
    await storage.converge(record)

    const [, pipeline] = call()

    assert.equal(pipeline[0].$replaceWith.$cond[2], '$$ROOT')
  })

  it('should write the record as a literal, so that a `$` value is not a field path', async () => {
    await storage.converge({ ...record, status: '$paid' })

    const [, pipeline] = call()
    const written = pipeline[0].$replaceWith.$cond[1].$literal

    assert.equal(written._id, 'a1')
    assert.equal(written.status, '$paid')
    assert.equal(written.id, undefined)
  })

  it('should answer true where it inserted', async () => {
    collection.updateOne.mock.mockImplementationOnce(async () => ({
      upsertedCount: 1,
      modifiedCount: 0
    }))

    assert.equal(await storage.converge(record), true)
  })

  it('should answer true where it superseded', async () => {
    collection.updateOne.mock.mockImplementationOnce(async () => ({
      upsertedCount: 0,
      modifiedCount: 1
    }))

    assert.equal(await storage.converge(record), true)
  })

  it('should read a record that lacks a region as the first one', async () => {
    await storage.converge(record)

    const [, pipeline] = call()
    const [, tied] = pipeline[0].$replaceWith.$cond[0].$or

    // the migration writes it, and one that reached here without it would win every tie
    assert.deepEqual(tied.$and[1].$gt[0], { $ifNull: ['$REGION', 0] })
  })

  it('should answer false where it changed nothing, and not throw', async () => {
    assert.equal(await storage.converge(record), false)
  })
})

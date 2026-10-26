import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { MongoClientBulkWriteError, MongoServerError } from 'mongodb'

import { bulkWrite } from '../src/bulk.js'

describe('bulkWrite', () => {
  it('should throw what the server refused the command with, labels and all', async () => {
    const conflict = new MongoServerError({
      message: 'Write conflict during plan execution and yielding is disabled.',
      code: 112,
      errorLabels: ['TransientTransactionError']
    })

    const wrapped = new MongoClientBulkWriteError({
      message: 'Mongo client bulk write encountered an error during execution'
    })

    wrapped.cause = conflict

    const client = { bulkWrite: mock.fn(async () => Promise.reject(wrapped)) }

    await assert.rejects(bulkWrite(client, [], {}), (error) => {
      assert.equal(error, conflict)
      assert.equal(error.hasErrorLabel('TransientTransactionError'), true)

      return true
    })
  })

  it('should throw what refused a write one by one as it is', async () => {
    const refused = new MongoClientBulkWriteError({
      message: 'Mongo client bulk write encountered errors during execution'
    })

    refused.writeErrors.set(0, { code: 11000, message: 'E11000 duplicate key error' })

    const client = { bulkWrite: mock.fn(async () => Promise.reject(refused)) }

    await assert.rejects(bulkWrite(client, [], {}), (error) => error === refused)
  })

  it('should answer what the client answers', async () => {
    const result = { matchedCount: 1, upsertedCount: 0 }
    const client = { bulkWrite: mock.fn(async () => result) }

    assert.equal(await bulkWrite(client, [], {}), result)
  })
})

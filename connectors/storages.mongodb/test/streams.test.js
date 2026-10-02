import { it } from 'node:test'
import assert from 'node:assert/strict'
import { Long, Timestamp } from 'mongodb'

import { Streams } from '../src/streams.js'

/**
 * A first read takes the position of a change stream, and kills the cursor that took it. The
 * driver gives a cursor id that fits a number as a number, and one that does not as a `Long`.
 */
function streams(id) {
  const killed = []

  const db = {
    command: async (command) => {
      if ('killCursors' in command) {
        killed.push(...command.cursors)

        return {}
      }

      return { cursor: { id, postBatchResumeToken: { _data: '82' } } }
    }
  }

  const session = { operationTime: new Timestamp(1n), endSession: async () => undefined }
  const cursor = {
    hasNext: async () => false,
    close: async () => undefined,
    [Symbol.asyncIterator]: async function* () {}
  }
  const collection = { s: { db }, collectionName: 'test', find: () => cursor }
  const client = () => ({ startSession: () => session })

  return { streams: new Streams(collection, client, (record) => record, true), killed }
}

for (const [name, id] of [
  ['a number', 7],
  ['a Long', Long.fromString('9007199254740993')]
])
  it(`should kill the cursor of the position, whose id is ${name}`, async () => {
    const { streams: read, killed } = streams(id)

    await read.stream({ criteria: {}, options: {} })

    assert.deepEqual(
      killed.map((one) => Long.fromValue(one).toString()),
      [Long.fromValue(id).toString()]
    )
    assert.ok(killed.every((one) => one instanceof Long))
  })

it('should kill no cursor that is closed already', async () => {
  const { streams: read, killed } = streams(0)

  await read.stream({ criteria: {}, options: {} })

  assert.deepEqual(killed, [])
})

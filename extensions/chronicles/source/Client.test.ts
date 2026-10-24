import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Client } from './Client.ts'
import type { Writer } from './Writer.ts'

let writer: { write: ReturnType<typeof mock.fn> }
let client: Client

beforeEach(async () => {
  writer = { write: mock.fn(async () => undefined) }
  client = new Client(() => writer as unknown as Writer)

  await client.connect()
})

/** what the batch written held, one row at a time */
const rows = (): any[] =>
  writer.write.mock.calls.flatMap((call) => call.arguments[0] as any[])

const event = {
  id: 'c1',
  name: 'page.viewed',
  time: 1761200000000,
  payload: { path: '/' }
}

it('should write each event under client, with its own id and time', async () => {
  const reply = await client.invoke('ingest', [event])

  assert.deepEqual(reply, { status: 202, accepted: 1 })

  const [message] = rows()

  assert.equal(message.id, 'c1')
  assert.equal(message.label, 'client.page.viewed')
  assert.equal(message.component, 'chronicles.ingestion')
  assert.equal(message.time, 1761200000000)
  assert.equal(message.entity, null)
  assert.deepEqual(message.payload, { path: '/' })
})

it('should read a batch sent as text', async () => {
  const reply = await client.invoke(
    'ingest',
    JSON.stringify([event, { ...event, id: 'c2' }])
  )

  assert.deepEqual(reply, { status: 202, accepted: 2 })
})

it('should refuse more than 100 events', async () => {
  const batch = Array.from({ length: 101 }, (_, i) => ({ ...event, id: `c${i}` }))
  const reply = (await client.invoke('ingest', batch)) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal(writer.write.mock.callCount(), 0)
})

it('should refuse a payload over 16 KiB, and say which', async () => {
  const large = { ...event, id: 'c2', payload: { blob: 'x'.repeat(17_000) } }
  const reply = (await client.invoke('ingest', [event, large])) as Error

  assert.equal(reply.message, 'OVERSIZED')
  assert.equal((reply.cause as any).index, 1)
  assert.equal(writer.write.mock.callCount(), 0)
})

it('should write nothing of a batch one event of which is not one', async () => {
  const reply = (await client.invoke('ingest', [
    event,
    { ...event, name: 'Page' }
  ])) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal((reply.cause as any).index, 1)
  assert.equal(writer.write.mock.callCount(), 0)
})

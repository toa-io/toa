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
  const reply = await client.invoke('ingest', { events: [event] }, null)

  assert.deepEqual(reply, { status: 202, accepted: 1 })

  const [written] = rows()

  assert.equal(written.id, 'c1')
  assert.equal(written.label, 'client.page.viewed')
  assert.equal(written.component, 'chronicles.ingestion')
  assert.equal(written.time, 1761200000000)
  assert.equal(written.entity, null)
  assert.equal(written.identity, null)
  assert.deepEqual(written.payload, { path: '/' })
})

it('should write the identity the gateway verified', async () => {
  await client.invoke('ingest', { events: [event], identity: 'a1b2' }, 'a1b2')

  assert.equal(rows()[0].identity, 'a1b2')
})

it('should refuse a body that says whose it is, where the path does not', async () => {
  const reply = (await client.invoke(
    'ingest',
    { events: [event], identity: 'a1b2' },
    null
  )) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal(writer.write.mock.callCount(), 0)
})

it('should read a batch sent as text, in one write', async () => {
  const reply = await client.invoke(
    'ingest',
    JSON.stringify({ events: [event, { ...event, id: 'c2' }] }),
    null
  )

  assert.deepEqual(reply, { status: 202, accepted: 2 })
  assert.equal(writer.write.mock.callCount(), 1)
})

it('should refuse an array, which is not the body', async () => {
  const reply = (await client.invoke('ingest', [event], null)) as Error

  assert.equal(reply.message, 'INVALID')
})

it('should refuse more than 100 events', async () => {
  const events = Array.from({ length: 101 }, (_, i) => ({ ...event, id: `c${i}` }))
  const reply = (await client.invoke('ingest', { events }, null)) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal(writer.write.mock.callCount(), 0)
})

it('should refuse a payload over 16 KiB, and say which', async () => {
  const large = { ...event, id: 'c2', payload: { blob: 'x'.repeat(17_000) } }
  const reply = (await client.invoke('ingest', { events: [event, large] }, null)) as Error

  assert.equal(reply.message, 'OVERSIZED')
  assert.equal((reply.cause as any).index, 1)
  assert.equal(writer.write.mock.callCount(), 0)
})

it('should write nothing of a batch one event of which is not one', async () => {
  const reply = (await client.invoke(
    'ingest',
    { events: [event, { ...event, name: 'Page' }] },
    null
  )) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal((reply.cause as any).index, 1)
  assert.equal(writer.write.mock.callCount(), 0)
})

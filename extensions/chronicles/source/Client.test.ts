import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Client } from './Client.ts'
import type { Writer } from './Writer.ts'

let writer: { write: ReturnType<typeof mock.fn> }
let client: Client

beforeEach(async () => {
  writer = { write: mock.fn(async () => undefined) }
  client = new Client(
    () => writer as unknown as Writer,
    () => 'truncated'
  )

  await client.connect()
})

/** what the batch written held, one encounter at a time */
const rows = (): any[] =>
  writer.write.mock.calls.flatMap((call) => call.arguments[2] as any[])

const event = {
  id: 'c1',
  name: 'page_viewed',
  time: 1761200000000,
  payload: { path: '/' }
}

it('should write each event as an encounter, with its own id and time', async () => {
  const reply = await client.invoke('write', { events: [event] }, null)

  assert.deepEqual(reply, { status: 202, accepted: 1 })

  const [written] = rows()

  assert.equal(written.id, 'c1')
  assert.equal(written.name, 'page_viewed')
  assert.equal(written.time, 1761200000000)
  assert.equal(written.visitor, null)
  assert.equal(written.session, null)
  assert.equal(written.identity, null)
  assert.deepEqual(written.payload, { path: '/' })
})

it('should write the identity the gateway verified', async () => {
  await client.invoke('write', { events: [event], identity: 'a1b2' }, 'a1b2')

  assert.equal(rows()[0].identity, 'a1b2')
})

it('should refuse a body that says whose it is, where the path does not', async () => {
  const reply = (await client.invoke(
    'write',
    { events: [event], identity: 'a1b2' },
    null
  )) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal(writer.write.mock.callCount(), 0)
})

it('should read a batch sent as a form, whose events are their JSON, in one write', async () => {
  const reply = await client.invoke(
    'write',
    { events: JSON.stringify([event, { ...event, id: 'c2' }]) },
    null
  )

  assert.deepEqual(reply, { status: 202, accepted: 2 })
  assert.equal(writer.write.mock.callCount(), 1)
})

it('should refuse an array, which is not the body', async () => {
  const reply = (await client.invoke('write', [event], null)) as Error

  assert.equal(reply.message, 'INVALID')
})

it('should refuse more than 100 events', async () => {
  const events = Array.from({ length: 101 }, (_, i) => ({ ...event, id: `c${i}` }))
  const reply = (await client.invoke('write', { events }, null)) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal(writer.write.mock.callCount(), 0)
})

it('should refuse a payload over 16 KiB, and say which', async () => {
  const large = { ...event, id: 'c2', payload: { blob: 'x'.repeat(17_000) } }
  const reply = (await client.invoke('write', { events: [event, large] }, null)) as Error

  assert.equal(reply.message, 'OVERSIZED')
  assert.equal((reply.cause as any).index, 1)
  assert.equal(writer.write.mock.callCount(), 0)
})

it('should write nothing of a batch one event of which is not one', async () => {
  const reply = (await client.invoke(
    'write',
    { events: [event, { ...event, name: 'Page' }] },
    null
  )) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal((reply.cause as any).index, 1)
  assert.equal(writer.write.mock.callCount(), 0)
})

it('should refuse a name with a dot', async () => {
  const reply = (await client.invoke(
    'write',
    { events: [{ ...event, name: 'page.viewed' }] },
    null
  )) as Error

  assert.equal(reply.message, 'INVALID')
})

it('should keep the network of the address, and the country, the gateway put in', async () => {
  await client.invoke(
    'write',
    { events: [event], ip: '203.0.113.7', country: 'DE' },
    null
  )

  assert.equal(rows()[0].ip, '203.0.113.0')
  assert.equal(rows()[0].country, 'DE')
})

it('should keep the whole address where the annotation says so', async () => {
  const full = new Client(
    () => writer as unknown as Writer,
    () => 'full'
  )

  await full.connect()
  await full.invoke('write', { events: [event], ip: '203.0.113.7', country: null }, null)

  assert.equal(rows()[0].ip, '203.0.113.7')
  assert.equal(rows()[0].country, null)
})

it('should write the visitor and the session of the batch', async () => {
  await client.invoke('write', { visitor: 'v1', session: 's1', events: [event] }, null)

  assert.equal(rows()[0].visitor, 'v1')
  assert.equal(rows()[0].session, 's1')
})

it('should refuse a visitor or a session that is not an id', async () => {
  for (const body of [
    { visitor: '', events: [event] },
    { session: 7, events: [event] },
    { visitor: 'v'.repeat(65), events: [event] }
  ]) {
    const reply = (await client.invoke('write', body, null)) as Error

    assert.equal(reply.message, 'INVALID')
  }
})

it('should keep a time as the client said, within what the store has dates for', async () => {
  await client.invoke('write', { events: [{ ...event, time: 0 }] }, null)

  assert.equal(rows()[0].time, 0)

  const reply = (await client.invoke(
    'write',
    { events: [{ ...event, time: Date.UTC(2300, 0, 1) }] },
    null
  )) as Error

  assert.equal(reply.message, 'INVALID')
})

it('should write the origin and the agent the gateway read, and what the agent is', async () => {
  await client.invoke(
    'write',
    {
      events: [event],
      origin: 'https://store.example',
      agent: 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0'
    },
    null
  )

  const [written] = rows()

  assert.equal(written.origin, 'https://store.example')
  assert.equal(written.browser, 'Firefox')
  assert.equal(written.os, 'Linux')
  assert.equal(written.device, 'desktop')
})

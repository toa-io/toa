import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Connector } from '@toa.io/core'
import { Client } from './Client.ts'
import type { extensions } from '@toa.io/core/types'

/** the relay, which a batch is a task to */
class Relay extends Connector {
  public readonly invoke = mock.fn(async (..._: unknown[]) => undefined)
}

let relay: Relay
let client: Client

const host = (): extensions.Host =>
  ({ remote: async () => relay }) as unknown as extensions.Host

beforeEach(async () => {
  relay = new Relay()
  client = new Client(host(), () => 'truncated')

  await client.connect()
})

/** what the tasks to the relay held, one encounter at a time */
const rows = (): any[] =>
  relay.invoke.mock.calls.flatMap((call) => {
    const [method, request] = call.arguments as [string, any]

    assert.equal(method, 'encounter')
    assert.equal(request.task, true)

    return request.input.encounters
  })

const sent = 1761200000000

const event = {
  id: 'c1',
  name: 'page_viewed',
  time: 1761200000000,
  payload: { path: '/' }
}

it('should write each event as an encounter, with its own id and time', async () => {
  const reply = await client.invoke('write', { sent, events: [event] }, null)

  assert.deepEqual(reply, { status: 202, accepted: 1 })

  const [written] = rows()

  assert.equal(written.id, 'c1')
  assert.equal(written.name, 'page_viewed')
  assert.ok(Math.abs(written.received - Date.now()) < 1000)
  assert.equal(written.time, written.received)
  assert.equal(written.visitor, null)
  assert.equal(written.session, null)
  assert.equal(written.identity, null)
  assert.deepEqual(written.payload, { path: '/' })
})

it('should write the identity the gateway verified', async () => {
  await client.invoke('write', { sent, events: [event], identity: 'a1b2' }, 'a1b2')

  assert.equal(rows()[0].identity, 'a1b2')
})

it('should refuse a body that says whose it is, where the path does not', async () => {
  const reply = (await client.invoke(
    'write',
    { sent, events: [event], identity: 'a1b2' },
    null
  )) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal(relay.invoke.mock.callCount(), 0)
})

it('should read a batch sent as a form, whose events are their JSON, in one write', async () => {
  const reply = await client.invoke(
    'write',
    { sent, events: JSON.stringify([event, { ...event, id: 'c2' }]) },
    null
  )

  assert.deepEqual(reply, { status: 202, accepted: 2 })
  assert.equal(relay.invoke.mock.callCount(), 1)
})

it('should refuse an array, which is not the body', async () => {
  const reply = (await client.invoke('write', [event], null)) as Error

  assert.equal(reply.message, 'INVALID')
})

it('should refuse more than 100 events', async () => {
  const events = Array.from({ length: 101 }, (_, i) => ({ ...event, id: `c${i}` }))
  const reply = (await client.invoke('write', { sent, events }, null)) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal(relay.invoke.mock.callCount(), 0)
})

it('should refuse a payload over 16 KiB, and say which', async () => {
  const large = { ...event, id: 'c2', payload: { blob: 'x'.repeat(17_000) } }
  const reply = (await client.invoke(
    'write',
    { sent, events: [event, large] },
    null
  )) as Error

  assert.equal(reply.message, 'OVERSIZED')
  assert.equal((reply.cause as any).index, 1)
  assert.equal(relay.invoke.mock.callCount(), 0)
})

it('should write nothing of a batch one event of which is not one', async () => {
  const reply = (await client.invoke(
    'write',
    { sent, events: [event, { ...event, name: 'Page' }] },
    null
  )) as Error

  assert.equal(reply.message, 'INVALID')
  assert.equal((reply.cause as any).index, 1)
  assert.equal(relay.invoke.mock.callCount(), 0)
})

it('should refuse a name with a dot', async () => {
  const reply = (await client.invoke(
    'write',
    { sent, events: [{ ...event, name: 'page.viewed' }] },
    null
  )) as Error

  assert.equal(reply.message, 'INVALID')
})

it('should keep the network of the address, and the country, the gateway put in', async () => {
  await client.invoke(
    'write',
    { sent, events: [event], ip: '203.0.113.7', country: 'DE' },
    null
  )

  assert.equal(rows()[0].ip, '203.0.113.0')
  assert.equal(rows()[0].country, 'DE')
})

it('should keep the whole address where the annotation says so', async () => {
  const full = new Client(host(), () => 'full')

  await full.connect()
  await full.invoke(
    'write',
    { sent, events: [event], ip: '203.0.113.7', country: null },
    null
  )

  assert.equal(rows()[0].ip, '203.0.113.7')
  assert.equal(rows()[0].country, null)
})

it('should write the visitor and the session of the batch', async () => {
  await client.invoke(
    'write',
    { sent, visitor: 'v1', session: 's1', events: [event] },
    null
  )

  assert.equal(rows()[0].visitor, 'v1')
  assert.equal(rows()[0].session, 's1')
})

it('should refuse a visitor or a session that is not an id', async () => {
  for (const body of [
    { sent, visitor: '', events: [event] },
    { sent, session: 7, events: [event] },
    { sent, visitor: 'v'.repeat(65), events: [event] }
  ]) {
    const reply = (await client.invoke('write', body, null)) as Error

    assert.equal(reply.message, 'INVALID')
  }
})

it('should reckon when an event happened by the gateway, at the distance the client measured', async () => {
  // the client's clock is an hour behind; the event was five seconds before sending
  await client.invoke(
    'write',
    { sent: 1761200000000, events: [{ ...event, time: 1761199995000 }] },
    null
  )

  const [written] = rows()

  assert.equal(written.received - written.time, 5000)
})

it('should refuse a batch that says nothing of when it was sent, or an event after it', async () => {
  for (const body of [
    { events: [event] },
    { sent: 'yesterday', events: [event] },
    { sent, events: [{ ...event, time: sent + 1 }] }
  ]) {
    const reply = (await client.invoke('write', body, null)) as Error

    assert.equal(reply.message, 'INVALID')
  }
})

it('should read `sent` of a form, which is a string', async () => {
  await client.invoke(
    'write',
    { sent: String(sent), events: JSON.stringify([event]) },
    null
  )

  assert.equal(rows().length, 1)
})

it('should write the origin and the agent the gateway read, and what the agent is', async () => {
  await client.invoke(
    'write',
    {
      sent,
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

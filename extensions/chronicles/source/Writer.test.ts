import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Writer } from './Writer.ts'
import type { Provider, Row } from './Provider.ts'

let provider: { write: ReturnType<typeof mock.fn> }
let writer: Writer

const row = (id: string): Row => ({
  id,
  label: 'store.orders.created',
  component: 'store.orders',
  time: 0,
  entity: null,
  version: null,
  identity: null,
  trace: null,
  payload: {}
})

beforeEach(() => {
  provider = { write: mock.fn(async () => undefined) }
  writer = new Writer(provider as unknown as Provider)
})

it('should write what arrives within a moment as one batch', async () => {
  await Promise.all([
    writer.write([row('a')]),
    writer.write([row('b')]),
    writer.write([row('c')])
  ])

  assert.equal(provider.write.mock.callCount(), 1)
  assert.deepEqual(
    (provider.write.mock.calls[0].arguments[0] as Row[]).map(({ id }) => id),
    ['a', 'b', 'c']
  )
})

it('should write a full batch without waiting', async () => {
  const rows = Array.from({ length: 1000 }, (_, i) => row(String(i)))
  const started = Date.now()

  await writer.write(rows)

  assert.ok(Date.now() - started < 400, 'a full batch waited')
})

it('should fail every caller of a batch that failed, and write the next one', async () => {
  provider.write.mock.mockImplementationOnce(async () => {
    throw new Error('the store is away')
  })

  const results = await Promise.allSettled([
    writer.write([row('a')]),
    writer.write([row('b')])
  ])

  assert.deepEqual(
    results.map(({ status }) => status),
    ['rejected', 'rejected']
  )

  await writer.write([row('c')])

  assert.equal(provider.write.mock.callCount(), 2)
})

it('should write rows and states of one moment together', async () => {
  const kept = {
    component: 'store.orders',
    entity: 'b5c8',
    version: 1,
    identity: null,
    time: 0,
    payload: {}
  }

  await Promise.all([writer.write([row('a')]), writer.write([], [kept])])

  assert.equal(provider.write.mock.callCount(), 1)
  assert.deepEqual(provider.write.mock.calls[0].arguments[1], [kept])
})

it('should write encounters with the rows of the same moment', async () => {
  const sent = {
    id: 'c1',
    name: 'page_viewed',
    time: 0,
    visitor: 'v1',
    session: null,
    identity: null,
    ip: null,
    country: null,
    origin: null,
    agent: null,
    browser: null,
    os: null,
    device: null,
    payload: {}
  }

  await Promise.all([writer.write([row('a')]), writer.write([], [], [sent])])

  assert.equal(provider.write.mock.callCount(), 1)
  assert.deepEqual(provider.write.mock.calls[0].arguments[2], [sent])
})

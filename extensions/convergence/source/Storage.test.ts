import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { console } from 'openspan'
import { Locator } from '@toa.io/core'

import { Converging } from './Storage.js'
import type { bindings, storages } from '@toa.io/core/types'

type Merge = (record: storages.Record) => Promise<boolean>

let storage: any
let inbound: any
let subscribe: ReturnType<typeof mock.fn>
let error: ReturnType<typeof mock.method<typeof console, 'error'>>

const locator = new Locator('converging', 'mongo')

/** the rank this suite runs as, which nothing that arrives should be carrying */
const REGION = 0

const connector = (properties: object): any => ({
  ...properties,
  link: mock.fn(),
  connect: mock.fn(async () => undefined),
  disconnect: mock.fn(async () => undefined)
})

const record = (properties: object = {}): storages.Record =>
  ({
    id: 'b5c8a1a0d1e04b1e9b3b8a3f2c7d6e50',
    VERSION: 3,
    CREATED: 1757320000000,
    UPDATED: 1757337600000,
    DELETED: null,
    REGION: 1,
    ...properties
  }) as unknown as storages.Record

const create = (): Converging =>
  new Converging(storage, locator, subscribe as unknown as (sink: bindings.Inbound) => any)

beforeEach(() => {
  mock.restoreAll()

  error = mock.method(console, 'error', () => undefined)

  storage = connector({
    merges: true,
    outbox: { collection: 'outbox' },
    merge: mock.fn<Merge>(async () => true),
    get: mock.fn(async () => null),
    store: mock.fn(async () => true)
  })

  inbound = connector({})
  subscribe = mock.fn(async () => inbound)
})

it('should refuse a storage that offers no outbox', async () => {
  storage.outbox = undefined

  await assert.rejects(create().connect(), /offers no outbox/)
  assert.equal(subscribe.mock.callCount(), 0)
})

it('should consume where the storage merges and the outbox is durable', async () => {
  const converging = create()

  await converging.connect()

  assert.equal(subscribe.mock.callCount(), 1)
  assert.equal(subscribe.mock.calls[0].arguments[0], converging)
  assert.equal(inbound.connect.mock.callCount(), 1)
})

it('should merge what arrives, as it stands', async () => {
  const arrived = record()

  await create().accept({ record: arrived })

  assert.equal(storage.merge.mock.callCount(), 1)
  assert.deepEqual(storage.merge.mock.calls[0].arguments[0], arrived)
})

it('should report a record carrying this region\'s own rank', async () => {
  await create().accept({ record: record({ REGION }) })

  assert.equal(error.mock.callCount(), 1)
  assert.match(error.mock.calls[0].arguments[0] as string, /this region's own rank/)

  // and merges it: dropping would leave the two regions differing for good
  assert.equal(storage.merge.mock.callCount(), 1)
})

it('should report nothing where the rank is another region\'s', async () => {
  await create().accept({ record: record({ REGION: REGION + 1 }) })

  assert.equal(error.mock.callCount(), 0)
})

it('should delegate what it does not do', async () => {
  const converging = create()
  const written = record()

  await converging.store(written)

  assert.equal(storage.store.mock.callCount(), 1)
  assert.deepEqual(storage.store.mock.calls[0].arguments[0], written)

  assert.equal(converging.merges, true)
  assert.deepEqual(converging.outbox, storage.outbox)
})

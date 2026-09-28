import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { console } from 'openspan'
import { Locator } from '@toa.io/core'

import { Converging } from './Storage.ts'
import type { bindings, outbox, storages } from '@toa.io/core/types'

type Converge = (record: storages.Record) => Promise<boolean>

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

const regional = (destinations: Partial<outbox.Regional>): Converging =>
  new Converging(
    storage,
    locator,
    subscribe as unknown as (sink: bindings.Inbound) => any,
    () => destinations as outbox.Regional
  )

beforeEach(() => {
  mock.restoreAll()

  error = mock.method(console, 'error', () => undefined)

  storage = connector({
    converges: true,
    outbox: { collection: 'outbox' },
    inbox: { recall: mock.fn(async () => null) },
    claims: true,
    converge: mock.fn<Converge>(async () => true),
    get: mock.fn(async () => null),
    store: mock.fn(async () => true),
    upsert: mock.fn(async () => null),
    ensure: mock.fn(async () => record())
  })

  inbound = connector({})
  subscribe = mock.fn(async () => inbound)
})

it('should refuse a storage that offers no outbox', async () => {
  storage.outbox = undefined

  await assert.rejects(create().connect(), /offers no outbox/)
  assert.equal(subscribe.mock.callCount(), 0)
})

it('should consume where the storage converges and the outbox is durable', async () => {
  const converging = create()

  await converging.connect()

  assert.equal(subscribe.mock.callCount(), 1)
  assert.equal(subscribe.mock.calls[0].arguments[0], converging)
  assert.equal(inbound.connect.mock.callCount(), 1)
})

it('should converge what arrives, as it stands', async () => {
  const arrived = record()

  await create().accept({ record: arrived })

  assert.equal(storage.converge.mock.callCount(), 1)
  assert.deepEqual(storage.converge.mock.calls[0].arguments[0], arrived)
})

it('should import what the change carried, once the record is converged', async () => {
  const order: string[] = []
  const carried = { realtime: [] }
  const imports = mock.fn(async (_: Record<string, unknown>) => {
    order.push('import')
  })

  storage.converge = mock.fn<Converge>(async () => {
    order.push('converge')

    return true
  })

  await regional({ import: imports }).accept({ record: record(), carried })

  assert.deepEqual(order, ['converge', 'import'])
  assert.equal(imports.mock.calls[0].arguments[0], carried)
})

it('should import what a stale record carried', async () => {
  const imports = mock.fn(async () => undefined)

  storage.converge = mock.fn<Converge>(async () => false)

  await regional({ import: imports }).accept({ record: record(), carried: { realtime: [] } })

  assert.equal(imports.mock.callCount(), 1)
})

it('should fail the delivery where the import fails', async () => {
  const imports = mock.fn(async () => {
    throw new Error('Redis is away')
  })

  await assert.rejects(
    regional({ import: imports }).accept({ record: record(), carried: { realtime: [] } }),
    /Redis is away/
  )
})

it('should import nothing where nothing was carried', async () => {
  const imports = mock.fn(async () => undefined)

  await regional({ import: imports }).accept({ record: record() })

  assert.equal(imports.mock.callCount(), 0)
})

it('should report a record carrying this region\'s own rank', async () => {
  await create().accept({ record: record({ REGION }) })

  assert.equal(error.mock.callCount(), 1)
  assert.match(error.mock.calls[0].arguments[0] as string, /this region's own rank/)

  // and converges it: dropping would leave the two regions differing for good
  assert.equal(storage.converge.mock.callCount(), 1)
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

  assert.equal(converging.converges, true)
  assert.deepEqual(converging.outbox, storage.outbox)
})

it('should pass the call on with every write that records one', async () => {
  const converging = create()
  const written = record()
  const call = { id: 'aa11e57cc0e14fce95c4496c21086781', reply: { output: {} } }

  await converging.store(written, undefined, call)
  await converging.upsert({ id: written.id }, { foo: 1 }, undefined, call)
  await converging.ensure(undefined, {}, written, undefined, call)

  assert.equal(storage.store.mock.calls[0].arguments[2], call)
  assert.equal(storage.upsert.mock.calls[0].arguments[3], call)
  assert.equal(storage.ensure.mock.calls[0].arguments[4], call)
})

it('should expose the inbox of what it decorates', () => {
  const converging = create()

  assert.equal(converging.inbox, storage.inbox)
  assert.equal(converging.claims, true)
})

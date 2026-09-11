import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Locator } from '@toa.io/core'

import { Destination } from './Destination.ts'
import type { bindings, outbox } from '@toa.io/core/types'

let outbound: any
let resolve: ReturnType<typeof mock.fn>

const locator = new Locator('converging', 'mongo')

const connector = (properties: object): any => ({
  ...properties,
  link: mock.fn(),
  connect: mock.fn(async () => undefined),
  disconnect: mock.fn(async () => undefined)
})

const row = (): outbox.Row =>
  ({
    id: '01a0881900047f9e8b4c1d2e3f4a5b6c',
    lane: 0,
    published: false,
    pending: 0,
    outstanding: ['convergence'],
    // a chain the write was made by, which convergence does not carry: the far side writes
    // through the storage, so it makes no call and publishes no event
    trail: ['default.mongo.converging.transit'],
    event: {
      origin: 'transited',
      state: {
        id: 'b5c8a1a0d1e04b1e9b3b8a3f2c7d6e50',
        foo: 1,
        VERSION: 4,
        CREATED: 1757320000000,
        UPDATED: 1757337600000,
        DELETED: null,
        REGION: 0
      },
      trailers: null,
      input: null
    }
  }) as unknown as outbox.Row

const create = (): Destination =>
  new Destination(locator, resolve as unknown as () => Promise<bindings.Outbound>)

beforeEach(() => {
  outbound = connector({ send: mock.fn(async () => undefined) })
  resolve = mock.fn(async () => outbound)
})

it('should be a destination named after the channel', async () => {
  assert.equal(create().name, 'convergence')
})

it('should send the record as it stands, under the component', async () => {
  const committed = row()
  const destination = create()

  await destination.connect()
  await destination.emit(committed)

  assert.equal(outbound.send.mock.callCount(), 1)

  const [label, message] = outbound.send.mock.calls[0].arguments

  assert.equal(label, 'mongo.converging')
  assert.deepEqual(message.record, committed.event.state)
})

// the chain is deliberately not among them; see `Destination.emit`
it('should send the record and the trace of the write, and nothing else', async () => {
  const destination = create()

  await destination.connect()
  await destination.emit(row())

  const [, message] = outbound.send.mock.calls[0].arguments

  assert.deepEqual(Object.keys(message).sort(), ['record', 'trace'])
  assert.match(message.trace, /^00-[\da-f]{32}-[\da-f]{16}-\d{2}$/)
})

it('should connect what it resolves', async () => {
  await create().connect()

  assert.equal(resolve.mock.callCount(), 1)
  assert.equal(outbound.connect.mock.callCount(), 1)
})

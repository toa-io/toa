import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Locator, entities } from '@toa.io/core'

import { Destination } from './Destination.ts'
import type { Channel } from './Channel.ts'
import type { outbox } from '@toa.io/core/types'

const locator = new Locator('orders', 'store')

let channel: { open: ReturnType<typeof mock.fn>; send: ReturnType<typeof mock.fn> }
let rendered: Record<string, { payload: unknown } | null>

const row = (): outbox.Row =>
  ({
    id: '019a1b2c3d4e7f9e8b4c1d2e3f4a5b6c',
    lane: 0,
    published: false,
    pending: 0,
    outstanding: ['chronicles'],
    event: {
      origin: null,
      state: { id: 'b5c8a1a0d1e04b1e9b3b8a3f2c7d6e50', total: 120, VERSION: 3 },
      input: null
    }
  }) as unknown as outbox.Row

async function create(labels: string[]): Promise<Destination> {
  const destination = new Destination(locator, labels, channel as unknown as Channel)

  destination.rendering = {
    render: async (label: string) => rendered[label]
  } as unknown as outbox.Rendering

  await destination.connect()

  return destination
}

beforeEach(() => {
  const outbound = {
    link: mock.fn(),
    connect: mock.fn(async () => undefined),
    disconnect: mock.fn(async () => undefined)
  }

  channel = { open: mock.fn(async () => outbound), send: mock.fn(async () => undefined) }
  rendered = {}
})

it('should be a destination named after the channel, rendering what it was given', async () => {
  const destination = await create(['created', 'snapshot'])

  assert.equal(destination.name, 'chronicles')
  assert.deepEqual(destination.renders, ['created', 'snapshot'])
})

it('should send each label the row renders for', async () => {
  rendered = {
    created: { payload: { total: 120 } },
    snapshot: { payload: { total: 120 } }
  }

  const destination = await create(['created', 'snapshot'])

  await destination.emit(row())

  const labels = channel.send.mock.calls.map((call) => (call.arguments[1] as any).label)

  assert.deepEqual(labels, ['store.orders.created', 'store.orders.snapshot'])
})

it('should send nothing for a label whose condition does not hold', async () => {
  rendered = { created: null, snapshot: { payload: {} } }

  const destination = await create(['created', 'snapshot'])

  await destination.emit(row())

  assert.equal(channel.send.mock.callCount(), 1)
})

it('should say which record changed, its version, and when', async () => {
  rendered = { created: { payload: { total: 120 } } }

  const committed = row()
  const destination = await create(['created'])

  await destination.emit(committed)

  const message = channel.send.mock.calls[0].arguments[1] as any

  assert.equal(message.id, entities.derive(committed.id, 'store.orders.created'))
  assert.equal(message.component, 'store.orders')
  assert.equal(message.entity, 'b5c8a1a0d1e04b1e9b3b8a3f2c7d6e50')
  assert.equal(message.version, 3)
  assert.equal(message.time, parseInt('019a1b2c3d4e', 16))
  assert.deepEqual(message.payload, { total: 120 })
})

it('should give a row the same id however often it is sent', async () => {
  rendered = { created: { payload: {} } }

  const destination = await create(['created'])

  await destination.emit(row())
  await destination.emit(row())

  const [first, second] = channel.send.mock.calls.map(
    (call) => (call.arguments[1] as any).id
  )

  assert.equal(first, second)
})

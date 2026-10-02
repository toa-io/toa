import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { console } from 'openspan'
import { Locator } from '@toa.io/core'

import { Destination } from './Destination.ts'
import type { outbox } from '@toa.io/core/types'
import type { Route } from '@toa.io/definitions/extensions.exposition/realtime'

const locator = new Locator('messages', 'chat')

const routes: Route[] = [
  {
    event: 'created',
    properties: ['sender', 'recipient'],
    literals: [],
    expose: ['id', 'text']
  },
  { event: 'deleted', properties: ['room'], literals: [], expose: ['id'] },
  { event: 'archived', properties: ['room'], literals: ['~rooms'], expose: ['id'] }
] as unknown as Route[]

const row = { id: '0001', event: { state: {} } } as unknown as outbox.Row

let error: ReturnType<typeof mock.method<typeof console, 'error'>>

const create = (payloads: Record<string, object | null>): Destination => {
  const destination = new Destination(locator, routes)

  destination.rendering = {
    render: async (label: string) =>
      payloads[label] === undefined || payloads[label] === null ? null : { payload: payloads[label] }
  }

  return destination
}

beforeEach(() => {
  mock.restoreAll()
  error = mock.method(console, 'error', () => undefined)
})

it('should export each routed event with its keys and what its route exposes', async () => {
  const destination = create({
    created: { id: 'm1', sender: 'alice', recipient: 'bob', text: 'hi', secret: 's' },
    deleted: null
  })

  assert.deepEqual(await destination.export(row), [
    {
      event: 'chat.messages.created',
      keys: ['alice', 'bob'],
      data: { id: 'm1', text: 'hi' }
    }
  ])
})

it('should export an event to the literals of its route', async () => {
  const destination = create({ archived: { id: 'm1', room: 'general' } })

  assert.deepEqual(await destination.export(row), [
    { event: 'chat.messages.archived', keys: ['general', '~rooms'], data: { id: 'm1' } }
  ])
})

it('should not take a value that begins with ~ for a key', async () => {
  const destination = create({
    created: { id: 'm1', sender: '~rooms', recipient: 'bob' },
    deleted: { id: 'm2', room: '~rooms' }
  })

  assert.deepEqual(await destination.export(row), [
    { event: 'chat.messages.created', keys: ['bob'], data: { id: 'm1' } }
  ])
})

it('should export nothing where no event is routed', async () => {
  const destination = create({ created: null, deleted: { id: 'm1' } })

  assert.equal(await destination.export(row), undefined)
})

it('should write nothing of what is not an export, and say so', async () => {
  const destination = create({})

  await destination.import({ event: 'not a list' })
  await destination.import([{ event: 'chat.messages.created', keys: [1] }])

  assert.equal(error.mock.callCount(), 2)
})

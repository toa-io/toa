import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { subscribe, unsubscribe } from 'node:diagnostics_channel'
import { environment } from '@toa.io/generic'
import { ANNOUNCED, publish } from './diagnostics.ts'
import type { Announcement } from './diagnostics.ts'

describe('publish', () => {
  const received: unknown[] = []
  const listener = (message: unknown): void => void received.push(message)
  const announcement: Announcement = { id: 'default.dummy', timestamp: 1 }

  afterEach(() => {
    unsubscribe(ANNOUNCED, listener)
    received.length = 0
    environment.delete('TOA_DEV')
  })

  it('should publish under TOA_DEV', () => {
    environment.set('TOA_DEV', '1')
    subscribe(ANNOUNCED, listener)

    publish(ANNOUNCED, announcement)

    assert.deepEqual(received, [announcement])
  })

  it('should publish nothing without TOA_DEV', () => {
    subscribe(ANNOUNCED, listener)

    publish(ANNOUNCED, announcement)

    assert.deepEqual(received, [])
  })
})

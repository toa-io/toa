import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NotFound } from '../../HTTP/index.ts'
import { Realtime } from './Realtime.ts'
import type { Context } from '../../HTTP/index.ts'

describe('realtime:stream', () => {
  const realtime = new Realtime()

  it('should name a route variable', () => {
    assert.deepEqual(realtime.create('stream', 'room', null, '/rooms/:room/stream'), {
      variable: 'room'
    })
  })

  it('should name a literal key at a route without variables', () => {
    assert.deepEqual(realtime.create('stream', '~room', null, '/rooms/stream'), {
      key: '~room'
    })
  })

  it('should refuse a literal that names no key', () => {
    assert.throws(() => realtime.create('stream', '~', null, '/rooms/stream'), /'~'/)
  })

  it('should refuse what is neither a route variable nor a literal', () => {
    assert.throws(() => realtime.create('stream', 'room', null, '/rooms/stream'), /'room'/)
  })

  it('should not serve a literal key by a route variable', async () => {
    const directive = realtime.create('stream', 'room', null, '/rooms/:room/stream')
    const context = { url: new URL('http://localhost/rooms/~room/stream/') } as Context

    await assert.rejects(
      realtime.precall([directive], context, [{ name: 'room', value: '~room' }]),
      // as a route that does not exist is, and not as streams that are not configured
      (error) => error instanceof NotFound && error.body === undefined
    )
  })
})

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
    assert.throws(
      () => realtime.create('stream', 'room', null, '/rooms/stream'),
      /'room'/
    )
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

describe('realtime:push', () => {
  const realtime = new Realtime()
  const input = { type: 'object' }

  it('should name a route variable, the event and the schema', () => {
    const directive = realtime.create(
      'push',
      { key: 'room', event: 'move', input },
      null,
      '/rooms/:room/moves'
    )

    assert.equal((directive as { variable: string }).variable, 'room')
    assert.equal((directive as { push: { event: string } }).push.event, 'move')
  })

  it('should name a literal key', () => {
    const directive = realtime.create(
      'push',
      { key: '~lobby', event: 'wave', input },
      null,
      '/lobby/waves'
    )

    assert.equal((directive as { key: string }).key, '~lobby')
  })

  it('should refuse what is neither a route variable nor a literal', () => {
    assert.throws(
      () =>
        realtime.create('push', { key: 'room', event: 'move', input }, null, '/moves'),
      /'room'/
    )
  })

  it('should refuse a push that names no event', () => {
    assert.throws(
      () => realtime.create('push', { key: 'room', input }, null, '/rooms/:room/moves'),
      /event/
    )
  })

  it('should refuse an event a reader would take for a token', () => {
    assert.throws(
      () =>
        realtime.create(
          'push',
          { key: 'room', event: 'token', input },
          null,
          '/rooms/:room/moves'
        ),
      /token/
    )
  })

  it('should refuse an event a reader would take for a routed one', () => {
    assert.throws(
      () =>
        realtime.create(
          'push',
          { key: 'room', event: 'chat.messages.sync', input },
          null,
          '/rooms/:room/moves'
        ),
      /chat\.messages\.sync/
    )
  })

  it('should refuse a push that states no schema', () => {
    assert.throws(
      () =>
        realtime.create(
          'push',
          { key: 'room', event: 'move' },
          null,
          '/rooms/:room/moves'
        ),
      /schema/
    )
  })

  it('should refuse a method with more than one realtime directive', () => {
    const stream = realtime.create('stream', 'room', null, '/rooms/:room')
    const push = realtime.create(
      'push',
      { key: 'room', event: 'move', input },
      null,
      '/rooms/:room'
    )

    assert.throws(() => realtime.arrange([stream, push]), /one realtime directive/)
  })
})

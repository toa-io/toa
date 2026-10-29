import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { Stream as Base } from './Stream.ts'

describe('Stream', () => {
  const push = { event: 'move', sender: 'bob', data: { x: 1 } }
  const streams: Base[] = []

  // a stream that is read from keeps a heartbeat
  class Stream extends Base {
    public constructor() {
      super()
      streams.push(this)
    }
  }

  afterEach(() => {
    for (const stream of streams.splice(0)) stream.destroy()
  })

  it('should send a pushed event without a token', () => {
    const stream = new Stream()

    stream.ready([])

    assert.equal(stream.volatile(push), true)
    assert.deepEqual(stream.read(), push)
    assert.equal(stream.read(), null)
  })

  it('should not move the cursor with a pushed event', () => {
    const stream = new Stream()

    stream.cursor = '1-0'
    stream.ready([])
    stream.volatile(push)

    assert.equal(stream.cursor, '1-0')
  })

  it('should drop a pushed event while the replay is in flight', () => {
    const stream = new Stream()

    assert.equal(stream.volatile(push), false)

    stream.ready([])

    assert.equal(stream.read(), null)
  })

  it('should drop a pushed event where the reader has not taken what it was sent', () => {
    const stream = new Stream()

    stream.ready([])

    for (let i = 0; i < stream.readableHighWaterMark; i++)
      assert.equal(stream.volatile(push), true)

    assert.equal(stream.volatile(push), false)
    assert.equal(stream.readableLength, stream.readableHighWaterMark)
  })

  it('should send a routed event to a reader that does not keep up', () => {
    const stream = new Stream()

    stream.ready([])

    for (let i = 0; i < stream.readableHighWaterMark; i++) stream.volatile(push)

    stream.deliver({ id: '1-0', event: 'sync', data: {} })

    assert.equal(stream.readableLength, stream.readableHighWaterMark + 2)
  })
})

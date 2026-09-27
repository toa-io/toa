import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'

import { Observation } from '../source/observation.js'
import * as parts from '../source/parts.ts'

const entity = {
  deleted: false,
  get: () => ({ id: 'x', VERSION: 1 }),
  set: () => undefined
}

function observation(answered, bare = false) {
  const cascade = {
    run: mock.fn(async () => (bare ? answered : { output: answered })),
    link: () => null
  }

  return new Observation(
    cascade,
    { entry: async () => entity, fit: () => undefined },
    { request: { fit: () => null }, reply: { fit: () => null } },
    { parse: (query) => query },
    { scope: 'entry' }
  )
}

const request = (output) => ({
  id: 'a'.repeat(32),
  input: null,
  query: { id: 'x' },
  authentic: true,
  ...(output === undefined ? {} : { output })
})

describe('output of a stream answered bare', () => {
  it('should answer the properties the request asks for of each object', async () => {
    const answered = Readable.from([{ title: 'First pot', volume: 100, id: 'x' }])
    const reply = await observation(answered, true).invoke(request(['id']))

    assert.deepStrictEqual(await reply.toArray(), [{ id: 'x' }])
  })

  it('should answer no output where the request asks for none of it, and close the stream', async () => {
    const answered = new Readable({ objectMode: true, read() { this.push({ id: 'x' }) } })
    const reply = await observation(answered, true).invoke(request([]))

    assert.deepStrictEqual(reply, {})
    assert.strictEqual(answered.destroyed, true)
  })
})

describe('output', () => {
  it('should answer the properties the request asks for, in the order the object holds them', async () => {
    const answered = { title: 'First pot', volume: 100, id: 'x' }
    const reply = await observation(answered).invoke(request(['id', 'title']))

    assert.deepStrictEqual(reply.output, { title: 'First pot', id: 'x' })
    assert.deepStrictEqual(Object.keys(reply.output), ['title', 'id'])
  })

  it('should answer each object of an array', async () => {
    const answered = [
      { title: 'First pot', volume: 100, id: 'x' },
      { title: 'Second pot', volume: 200, id: 'y' }
    ]

    const reply = await observation(answered).invoke(request(['id']))

    assert.deepStrictEqual(reply.output, [{ id: 'x' }, { id: 'y' }])
  })

  it('should answer no output where the request asks for none of it', async () => {
    const answered = { title: 'First pot', id: 'x', VERSION: 3 }
    const reply = await observation(answered).invoke(request([]))

    assert.strictEqual('output' in reply, false)
  })

  it('should answer a value that is not an object as it is', async () => {
    const reply = await observation('hello').invoke(request(['title']))

    assert.strictEqual(reply.output, 'hello')
  })

  it('should answer the properties the request asks for of each object a stream yields', async () => {
    const answered = Readable.from([
      { title: 'First pot', volume: 100, id: 'x' },
      'hello',
      { title: 'Second pot', volume: 200, id: 'y' }
    ])

    const reply = await observation(answered).invoke(request(['id', 'title']))

    assert.deepStrictEqual(await reply.output.toArray(), [
      { title: 'First pot', id: 'x' },
      'hello',
      { title: 'Second pot', id: 'y' }
    ])
  })

  it('should close a stream the request asks for none of, unread', async () => {
    let read = 0

    const answered = new Readable({
      objectMode: true,
      read() {
        read++
        this.push({ id: 'x' })
      }
    })

    const reply = await observation(answered).invoke(request([]))

    assert.strictEqual('output' in reply, false)
    await finished(answered).catch(() => undefined)
    assert.strictEqual(answered.destroyed, true)
    assert.strictEqual(read, 0)
  })

  it('should close the stream it answered from when its reader closes the restricted one', async () => {
    const answered = new Readable({ objectMode: true, read() { this.push({ id: 'x', volume: 1 }) } })
    const reply = await observation(answered).invoke(request(['id']))

    for await (const _ of reply.output) break

    await finished(answered).catch(() => undefined)
    assert.strictEqual(answered.destroyed, true)
  })

  it('should fail the restricted stream where the stream it answered from fails', async () => {
    const answered = new Readable({ objectMode: true, read() { this.destroy(new Error('broken')) } })
    const reply = await observation(answered).invoke(request(['id']))

    await assert.rejects(reply.output.toArray(), { message: 'broken' })
  })

  it('should answer of each part a storage made the properties the request asks for of its entry', async () => {
    const answered = Readable.from([
      parts.entry({ id: 'x', title: 'First pot', volume: 100 }),
      parts.removed('y'),
      parts.token('t')
    ])

    const reply = await observation(answered).invoke(request(['id', 'title']))

    assert.deepStrictEqual(await reply.output.toArray(), [
      { entry: { id: 'x', title: 'First pot' } },
      { removed: 'y' },
      { token: 't' }
    ])
  })

  it('should answer an object an operation built in the shape of a part as any object', async () => {
    const answered = Readable.from([{ entry: { id: 'x', volume: 100 } }])
    const reply = await observation(answered).invoke(request(['id']))

    assert.deepStrictEqual(await reply.output.toArray(), [{}])
  })

  it('should answer a stream of bytes as it is', async () => {
    const answered = Readable.from([Buffer.from('hello')], { objectMode: false })
    const reply = await observation(answered).invoke(request(['id']))

    assert.strictEqual(reply.output, answered)
  })

  it('should answer a stream whole where the request asks for nothing in particular', async () => {
    const answered = Readable.from([{ title: 'First pot', id: 'x' }])
    const reply = await observation(answered).invoke(request())

    assert.strictEqual(reply.output, answered)
  })

  it('should answer the output whole where the request asks for nothing in particular', async () => {
    const answered = { title: 'First pot', volume: 100, id: 'x' }
    const reply = await observation(answered).invoke(request())

    assert.deepStrictEqual(reply.output, answered)
    assert.strictEqual(reply.system, undefined)
  })
})

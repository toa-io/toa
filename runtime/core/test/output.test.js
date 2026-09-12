import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Observation } from '../source/observation.js'

const entity = {
  deleted: false,
  get: () => ({ id: 'x', VERSION: 1 }),
  set: () => undefined
}

function observation(answered) {
  const cascade = { run: mock.fn(async () => ({ output: answered })), link: () => null }

  return new Observation(
    cascade,
    { object: async () => entity, fit: () => undefined },
    { request: { fit: () => null }, reply: { fit: () => null } },
    { parse: (query) => query },
    { scope: 'object' }
  )
}

const request = (output) => ({
  id: 'a'.repeat(32),
  input: null,
  query: { id: 'x' },
  authentic: true,
  ...(output === undefined ? {} : { output })
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

  // what a cache validates by, which a caller reads whatever its request asked for
  it('should answer the system properties beside a restricted output', async () => {
    const answered = { title: 'First pot', id: 'x', VERSION: 3, UPDATED: 17, CREATED: 16 }
    const reply = await observation(answered).invoke(request(['title']))

    assert.deepStrictEqual(reply.output, { title: 'First pot' })
    assert.deepStrictEqual(reply.system, { VERSION: 3, CREATED: 16, UPDATED: 17 })
  })

  it('should answer no output where the request asks for none of it', async () => {
    const answered = { title: 'First pot', id: 'x', VERSION: 3 }
    const reply = await observation(answered).invoke(request([]))

    assert.strictEqual('output' in reply, false)
    assert.deepStrictEqual(reply.system, { VERSION: 3 })
  })

  it('should answer a value that is not an object as it is', async () => {
    const reply = await observation('hello').invoke(request(['title']))

    assert.strictEqual(reply.output, 'hello')
  })

  it('should answer the output whole where the request asks for nothing in particular', async () => {
    const answered = { title: 'First pot', volume: 100, id: 'x' }
    const reply = await observation(answered).invoke(request())

    assert.deepStrictEqual(reply.output, answered)
    assert.strictEqual(reply.system, undefined)
  })
})

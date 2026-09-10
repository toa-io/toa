import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Transition } from '../source/transition.js'
import { codes } from '../source/exceptions.js'
import { DuplicateCallException } from '../source/exceptions.js'

const ID = 'a'.repeat(32)

let recall, commit, algorithm, entity

/** A `State` as a transition uses one, with the inbox reachable through `recall`. */
function scope() {
  return {
    recall: mock.fn(async (id) => recall(id)),
    commit: mock.fn(async (state, input, call) => commit(state, input, call)),
    init: () => entity,
    object: async () => entity,
    fit: () => undefined
  }
}

function transition(definition = {}) {
  const cascade = {
    run: mock.fn(async (...args) => algorithm(...args)),
    link: () => null
  }

  return new Transition(
    cascade,
    scope(),
    { request: { fit: () => null }, reply: { fit: () => null } },
    { parse: (query) => query },
    { scope: 'object', once: true, ...definition }
  )
}

const request = (id = ID) => ({ id, input: null, query: { id: 'x' }, authentic: true })

beforeEach(() => {
  recall = async () => null
  commit = async () => true
  algorithm = async () => ({ output: 'made' })

  entity = {
    deleted: false,
    get: () => ({ id: 'x', VERSION: 1 }),
    set: () => undefined
  }
})

describe('once', () => {
  it('should answer what the call answered before, without running', async () => {
    let ran = 0

    algorithm = async () => {
      ran++

      return { output: 'made' }
    }

    const operation = transition()

    operation.scope.recall = mock.fn(async () => ({ output: 'the first' }))

    const reply = await operation.invoke(request())

    assert.deepStrictEqual(reply, { output: 'the first' })
    assert.strictEqual(ran, 0, 'the algorithm ran')
    assert.strictEqual(operation.scope.commit.mock.callCount(), 0)
  })

  it('should record the call with what it answered', async () => {
    const operation = transition()

    await operation.invoke(request())

    const [, , call] = operation.scope.commit.mock.calls[0].arguments

    assert.deepStrictEqual(call, { id: ID, reply: { output: 'made' } })
  })

  it('should record nothing where the operation was not declared once', async () => {
    const operation = transition({ once: false })

    await operation.invoke(request())

    const [, , call] = operation.scope.commit.mock.calls[0].arguments

    assert.strictEqual(call, undefined)
  })

  it('should look the call up once, not once per attempt', async () => {
    let attempts = 0

    commit = async () => ++attempts >= 3

    const operation = transition({ concurrency: 'retry' })

    await operation.invoke(request())

    assert.strictEqual(operation.scope.commit.mock.callCount(), 3)
    assert.strictEqual(operation.scope.recall.mock.callCount(), 1)
  })

  /*
   * The duplicate arrived while the first was still running, so the read in front found nothing
   * and the write is what refused it. It is answered with what the other one answered.
   */
  it('should answer from the record where the write refused it', async () => {
    let looked = 0

    const operation = transition()

    operation.scope.recall = mock.fn(async () =>
      ++looked === 1 ? null : { output: 'the first' }
    )

    commit = async () => {
      throw new DuplicateCallException(ID)
    }

    const reply = await operation.invoke(request())

    assert.deepStrictEqual(reply, { output: 'the first' })
  })

  it('should not retry a call the write refused', async () => {
    const operation = transition({ concurrency: 'retry' })

    operation.scope.recall = mock.fn(async () => null)

    commit = mock.fn(async () => {
      throw new DuplicateCallException(ID)
    })

    await operation.invoke(request())

    assert.strictEqual(operation.scope.commit.mock.callCount(), 1)
  })

  it('should refuse a request that carries no identity', async () => {
    const operation = transition()

    const reply = await operation.invoke({
      input: null,
      query: { id: 'x' },
      authentic: true
    })

    assert.strictEqual(reply.exception.code, codes.RequestContract)
    assert.strictEqual(operation.scope.commit.mock.callCount(), 0)
  })
})

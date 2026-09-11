import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { mock } from 'node:test'

import * as fixtures from './context.fixtures.js'
import { Context } from '../source/context.js'
import { codes } from '../source/exceptions.js'

/** @type {import('@toa.io/core').Context} */
let context

beforeEach(() => {
  resetCalls()

  context = new Context(fixtures.local, fixtures.discover, fixtures.aspects)
})

it('should expose aspects', () => {
  assert.notStrictEqual(context.aspects, undefined)
  assert.deepStrictEqual(context.aspects, fixtures.aspects)
})

describe('call', () => {
  it('should discover once', async () => {
    const request = {}

    await context.call('a', 'b', 'c', request)
    await context.call('a', 'b', 'c', request)

    assert.strictEqual(fixtures.discover.mock.callCount(), 1)
  })
})

// a caller that stops waiting is answered at once, whether its component has been found yet or not
describe('call waited for', () => {
  /** a lookup that has found nothing yet, and a remote it would have found */
  const pending = () => {
    const remote = { invoke: mock.fn(), link: mock.fn() }
    const discover = mock.fn(() => new Promise(() => undefined))

    return { remote, context: new Context(fixtures.local, discover, fixtures.aspects) }
  }

  it('should end the call when its signal aborts while the component is looked up', async () => {
    const { remote, context } = pending()
    const controller = new AbortController()
    const reason = new Error('stopped waiting')
    const call = context.call('a', 'b', 'c', {}, { signal: controller.signal })

    controller.abort(reason)

    await assert.rejects(call, (exception) => {
      assert.strictEqual(exception.code, codes.Abandoned)
      assert.strictEqual(exception.cause, reason)

      return true
    })

    assert.strictEqual(remote.invoke.mock.callCount(), 0)
  })

  it('should end at once a call whose signal aborted before it was made', async () => {
    const { context } = pending()
    const controller = new AbortController()

    controller.abort()

    await assert.rejects(context.call('a', 'b', 'c', {}, { signal: controller.signal }), (exception) =>
      exception.code === codes.Abandoned)
  })
})

function resetCalls(target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

describe('region', () => {
  it('should be zero where a deployment is no region', () => {
    assert.strictEqual(context.region, 0)
  })

  it('should be the rank this deployment writes with', () => {
    process.env.TOA_REGION = '1'

    try {
      assert.strictEqual(new Context(fixtures.local, fixtures.discover).region, 1)
    } finally {
      delete process.env.TOA_REGION
    }
  })
})

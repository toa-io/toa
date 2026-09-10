import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { Component } from '../source/component.js'
import { Remote } from '../source/remote.js'
import * as trail from '../source/trail.js'
import { codes } from '../source/exceptions.js'
import * as fixtures from './component.fixtures.js'

describe('Invocations', () => {
  const name = ['foo', 'bar'][Math.floor(2 * Math.random())]
  const invocation = fixtures.invocations[name]
  const component = new Component(fixtures.locator, fixtures.invocations)

  beforeEach(() => {
    resetCalls()
  })

  it('should invoke', async () => {
    await component.invoke(name)

    assert.ok(invocation.invoke.mock.callCount() > 0)
  })

  it('should refuse an endpoint it does not provide', async () => {
    // a fact about the component, and one that crosses a binding: a code, not an assertion
    await assert.rejects(
      async () => await component.invoke('baz'),
      (error) => error.code === codes.Endpoint
    )
  })

  it('should invoke input and query', async () => {
    const input = { test: Math.random() }
    const query = { test: Math.random() }
    await component.invoke(name, { input, query })

    assert.ok(
      invocation.invoke.mock.calls.some(
        (call) =>
          call.arguments.length === 1 &&
          isDeepStrictEqual(call.arguments[0], { input, query })
      )
    )
  })

  it('should return io', async () => {
    const io = await component.invoke(name)

    assert.strictEqual(io, fixtures.invocations[name].invoke.mock.calls[0].result)
  })
})

describe('The chain', () => {
  const locator = { id: 'default.orders' }

  beforeEach(() => {
    resetCalls()
  })

  it('should append the endpoint it is entered by', async () => {
    const seen = await chain(new Component(locator, invocations()), 'foo')

    assert.deepEqual(seen, ['default.orders.foo'])
  })

  it('should continue what the request carries', async () => {
    const seen = await chain(new Component(locator, invocations()), 'foo', {
      trail: ['exposition', '~default.billing.charged']
    })

    assert.deepEqual(seen, ['exposition', '~default.billing.charged', 'default.orders.foo'])
  })

  it('should not be written back onto the request', async () => {
    // the loop binding hands over the caller's own object, so appending onto it would
    // reach into a request the caller may still be using
    const request = { trail: ['exposition'] }

    await new Component(locator, invocations()).invoke('foo', request)

    assert.deepEqual(request.trail, ['exposition'])
  })

  it('should not be appended to by a remote, which names the same endpoint', async () => {
    const seen = await chain(new Remote(locator, invocations()), 'foo')

    assert.equal(seen, undefined)
  })

  it('should not be appended to by an endpoint of the runtime\'s own', async () => {
    const operations = invocations()
    const component = new Component(locator, { ...operations, '.lookup': operations.foo })

    assert.equal(await chain(component, '.lookup'), undefined)
  })

  it('should refuse a call that has been here already, before the operation runs', async () => {
    const operations = invocations()
    const component = new Component(locator, operations)
    const hop = 'default.orders.foo'

    const reply = await component.invoke('foo', { trail: [hop, hop] })

    assert.equal(reply.exception.code, codes.Loop)
    assert.deepEqual(reply.exception.trail, [hop, hop, hop])
    assert.equal(operations.foo.invoke.mock.callCount(), 0)
  })

  /** What the endpoint saw as its chain, or `undefined` where it was given none. */
  async function chain (component, endpoint, request) {
    let seen

    component.operations[endpoint].invoke = () => {
      seen = trail.current()

      return null
    }

    await component.invoke(endpoint, request)

    return seen
  }

  function invocations () {
    return {
      foo: { invoke: mock.fn(() => null), link: () => null }
    }
  }
})

function resetCalls(target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

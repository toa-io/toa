'use strict'

const { describe, it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { Component } = require('../src/component')
const { codes } = require('../src/exceptions')
const fixtures = require('./component.fixtures')
const { AssertionError } = require('node:assert')

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

  it('should throw on unknown invocation name', async () => {
    await assert.rejects(() => component.invoke('baz'), AssertionError)
  })

  it('should invoke input and query', async () => {
    const input = { test: Math.random() }
    const query = { test: Math.random() }
    await component.invoke(name, { input, query })

    assert.ok(invocation.invoke.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], { input, query })))
  })

  it('should return io', async () => {
    const io = await component.invoke(name)

    assert.strictEqual(io, fixtures.invocations[name].invoke.mock.calls[0].result)
  })
})

function resetCalls (target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

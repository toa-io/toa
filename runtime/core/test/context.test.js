'use strict'

const { describe, it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')

const fixtures = require('./context.fixtures')
const { Context } = require('../src/context')

/** @type {toa.core.Context} */
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

function resetCalls (target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

'use strict'

const { it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')

const { aspect } = require('./.test/mock.aspect')
const { amqp } = require('./amqp')

it('should be', async () => {
  assert.ok(amqp instanceof Function)
})

/** @type {toa.node.Context} */
let context

beforeEach(() => {
  resetCalls()

  context = /** @type {toa.node.Context} */ {}

  amqp(context, aspect)
})

it('should define shortcut', async () => {
  assert.notStrictEqual(context.amqp, undefined)
})

it('should call invoke', async () => {
  const args = Array.from({ length: random(5) + 2 }, () => generate())

  await context.amqp.test.emit(...args)

  assert.ok(aspect.invoke.mock.calls.some((call) => isDeepStrictEqual(call.arguments, ['test', 'emit', ...args])))
})

it('should throw if wrong amount of segments', async () => {
  await assert.rejects(context.amqp.one.two.emit(), (error) => /AMQP aspect call should have 2 segments \[one, two, emit\] given/.test(error.message))
})

function resetCalls (target = [assert], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

'use strict'

const { it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')

const fixtures = require('./context.configuration.fixtures')
const { Context } = require('../src/context')

let context

beforeEach(async () => {
  resetCalls()

  context = new Context(fixtures.context)

  await context.connect()
})

it('should expose aspect', async () => {
  assert.notStrictEqual(context.aspects.configuration, undefined)
})

it('should expose values', () => {
  assert.deepStrictEqual(context.configuration, fixtures.configuration)
  assert.deepStrictEqual(context.configuration.foo, fixtures.configuration.foo)
})

function resetCalls (target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

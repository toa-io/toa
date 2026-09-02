import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import * as fixtures from './context.state.fixtures.js'
import { Context } from '../src/context.js'
import { generate } from 'randomstring'

const state = fixtures.context.aspects[0]

/** @type {Context} */
let context

beforeEach(async () => {
  resetCalls()

  context = new Context(fixtures.context)

  await context.connect()
})

it('should expose aspect', async () => {
  assert.notStrictEqual(context.aspects.state, undefined)
})

it('should set value', async () => {
  context.state.a = 1

  assert.ok(state.invoke.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], { a: 1 })))
})

it('should get value', async () => {
  const b = generate()

  state.invoke.mock.mockImplementation(() => ({ a: { b } }))

  const value = context.state.a.b

  assert.deepStrictEqual(value, b)

  state.invoke.mock.resetCalls()
})

function resetCalls (target = [assert, fixtures, state], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

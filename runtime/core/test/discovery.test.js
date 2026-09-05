import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { console } from 'openspan'
import { Connector } from '../source/connector.js'
import { Discovery } from '../source/discovery.js'

class Lookup extends Connector {
  invoke = mock.fn(async () => ({ operations: {} }))
}

/** @type {Lookup} */
let lookup

/** @type {Discovery} */
let discovery

/** @type {import('node:test').Mock<any>} */
let warn

const locator = { id: 'dummies.one' }

beforeEach(async () => {
  mock.timers.enable()

  warn = mock.method(console, 'warn', () => undefined)
  lookup = new Lookup()
  discovery = new Discovery(async () => lookup)

  await discovery.connect()
})

afterEach(() => {
  warn.mock.restore()
  mock.timers.reset()
})

it('should not warn if a lookup is answered', async () => {
  await discovery.lookup(locator)

  mock.timers.tick(60_000)

  assert.strictEqual(warn.mock.callCount(), 0)
})

it('should keep warning while a lookup is unanswered', async () => {
  lookup.invoke.mock.mockImplementation(() => new Promise(() => undefined))

  void discovery.lookup(locator)

  // the interval is set after the lookup is resolved, so it has to exist
  // before time is advanced
  await new Promise((resolve) => process.nextTick(resolve))

  // node:test moves the clock before running the callbacks it releases, so the
  // elapsed time each warning reports is only right when time advances by steps
  mock.timers.tick(5_000)
  mock.timers.tick(5_000)

  assert.strictEqual(warn.mock.callCount(), 2)

  assert.ok(((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], 'Waiting for lookup response') && isDeepStrictEqual(call.arguments[1], { component: locator.id, waiting: 10 }))(warn.mock.calls.at(-1) ?? { arguments: [] }))
})

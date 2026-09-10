import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import clone from 'clone-deep'

import { Connector } from '../source/connector.js'

// the fixtures are not connectors, so a dependency is recorded rather than linked
const depends = mock.method(Connector.prototype, 'depends', () => undefined)

const dependencies = (instance) =>
  depends.mock.calls
    .filter((call) => call.this === instance)
    .map((call) => call.arguments[0])
import { Emission } from '../source/emission.js'
import * as fixtures from './emission.fixtures.js'

let emission, row

beforeEach(async () => {
  resetCalls()
  depends.mock.resetCalls()

  emission = new Emission(fixtures.events)
  row = clone(fixtures.row)

  await emission.open()
})

it('should depend on events', () => {
  assert.ok(emission instanceof Connector)
  assert.ok(dependencies(emission).some((one) => isDeepStrictEqual(one, fixtures.events)))
})

// the row and not its event alone: what goes on the wire is the chain it carries too
it('should emit the row to every event', async () => {
  await emission.emit(row)

  for (const evt of fixtures.events) {
    assert.ok(
      evt.emit.mock.calls.some(
        (call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], row)
      )
    )
  }
})

function resetCalls(
  target = [assert, clone, depends, dependencies, fixtures],
  seen = new Set()
) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

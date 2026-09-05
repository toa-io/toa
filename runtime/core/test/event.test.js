import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import clone from 'clone-deep'

import { Connector } from '../source/connector.js'
import { Event } from '../source/event.js'
import * as fixtures from './event.fixtures.js'

let event, emit

// the fixtures are not connectors, so the dependency is recorded rather than linked
const depends = mock.method(Connector.prototype, 'depends', () => undefined)

const dependencies = (instance) => depends.mock.calls
  .filter((call) => call.this === instance)
  .map((call) => call.arguments[0])

beforeEach(() => {
  resetCalls()
  depends.mock.resetCalls()

  event = new Event(fixtures.definition, fixtures.binding, fixtures.bridge)
  emit = () => event.emit(fixtures.event)
})

it('should depend on binding', () => {
  assert.ok(event instanceof Connector)
  assert.ok(dependencies(event).some((one) => isDeepStrictEqual(one, fixtures.binding)))
})

it('should depend on bridge if provided', () => {
  assert.ok(dependencies(event).some((one) => isDeepStrictEqual(one, fixtures.bridge)))

  const bridgeless = new Event(fixtures.definition, fixtures.binding)

  assert.ok(!dependencies(bridgeless).some((one) => isDeepStrictEqual(one, fixtures.bridge)))
})

describe('condition', () => {
  describe('conditioned', () => {
    it('should call condition', async () => {
      await emit()

      assert.ok(fixtures.bridge.condition.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], fixtures.event)))
    })

    it('should emit if condition returns true', async () => {
      await emit()

      const payload = await fixtures.bridge.payload.mock.calls[0].result
      assertEmitted(payload)
    })

    it('should not emit if condition returns false', async () => {
      const origin = clone(fixtures.event.origin)

      origin.falsy = true

      await event.emit(origin, fixtures.event.changeset, fixtures.event.state)

      assert.strictEqual(fixtures.binding.emit.mock.callCount(), 0)
    })
  })

  describe('unconditioned', () => {
    beforeEach(() => {
      const definition = clone(fixtures.definition)

      definition.conditioned = false

      event = new Event(definition, fixtures.binding, fixtures.bridge)
    })

    it('should not call condition', async () => {
      await event.emit(fixtures.event.origin, fixtures.event.changeset, fixtures.event.state)

      assert.ok(!(fixtures.bridge.condition.mock.calls.some((call) => call.arguments.length === 0)))

      const payload = await fixtures.bridge.payload.mock.calls[0].result
      assertEmitted(payload)
    })
  })
})

describe('payload', () => {
  describe('subjective', () => {
    it('should emit payload', async () => {
      await emit()

      const payload = await fixtures.bridge.payload.mock.calls[0].result
      assertEmitted(payload)
    })
  })

  describe('objective', () => {
    beforeEach(() => {
      const definition = clone(fixtures.definition)

      definition.subjective = false

      event = new Event(definition, fixtures.binding, fixtures.bridge)
      emit = () => event.emit(fixtures.event)
    })

    it('should not call payload', async () => {
      await emit()

      assert.strictEqual(fixtures.bridge.payload.mock.callCount(), 0)
    })

    it('should return state as payload', async () => {
      await emit()

      const payload = fixtures.event.state
      assertEmitted(payload)
    })
  })
})

function resetCalls (target = [assert, clone, fixtures, depends, dependencies], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

/** The message carries the payload and a telemetry token generated per emission. */
function assertEmitted (payload) {
  const emitted = fixtures.binding.emit.mock.calls
    .map((call) => call.arguments[0])
    .filter((message) => isDeepStrictEqual(message.payload, payload))

  assert.notStrictEqual(emitted.length, 0)

  for (const message of emitted) {
    assert.strictEqual(typeof message.telemetry, 'string')
    assert.deepStrictEqual(Object.keys(message).sort(), ['payload', 'telemetry'])
  }
}

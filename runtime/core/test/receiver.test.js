import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import clone from 'clone-deep'
import { generate } from 'randomstring'
import { merge } from '@toa.io/generic'

import { Connector } from '../source/connector.js'

// the fixtures are not connectors, so a dependency is recorded rather than linked
const depends = mock.method(Connector.prototype, 'depends', () => undefined)

const dependencies = (instance) =>
  depends.mock.calls
    .filter((call) => call.this === instance)
    .map((call) => call.arguments[0])

import { Receiver } from '../source/receiver.js'
import * as fixtures from './receiver.fixtures.js'

/** @type {import('@toa.io/core/types').Receiver} */
let receiver

/** @type {toa.norm.component.Receiver} */
let definition

/** the event the receiver adds to the chain of every call it makes */
const hop = '~' + fixtures.definition.destination

beforeEach(() => {
  resetCalls()
  depends.mock.resetCalls()

  definition = clone(fixtures.definition)
  receiver = new Receiver(fixtures.definition, fixtures.local, fixtures.bridge)
})

it('should depend on local, bridge', () => {
  assert.ok(dependencies(receiver).some((one) => isDeepStrictEqual(one, fixtures.local)))
  assert.ok(dependencies(receiver).some((one) => isDeepStrictEqual(one, fixtures.bridge)))
})

it('should apply', async () => {
  const payload = { foo: 'bar' }

  await receiver.receive({ payload })

  assert.ok(
    fixtures.local.invoke.mock.calls.some(
      (call) =>
        call.arguments.length === 2 &&
        isDeepStrictEqual(call.arguments[0], definition.operation) &&
        isDeepStrictEqual(call.arguments[1], { input: payload, trail: [hop] })
    )
  )
})

for (const [adaptive] of [[false], [true]])
  it(`should pass UI extensions (adaptive: ${adaptive})`, async () => {
    resetCalls()

    definition.adaptive = adaptive
    receiver = new Receiver(definition, fixtures.local, fixtures.bridge)

    const payload = { foo: generate() }
    const extension = { [generate()]: generate() }
    const message = { payload, ...extension }

    await receiver.receive(message)

    const request = adaptive
      ? await fixtures.bridge.request.mock.calls[0].result
      : { input: payload }
    const expected = { ...merge(clone(request), extension), trail: [hop] }

    const argument = fixtures.local.invoke.mock.calls[0].arguments[1]

    assert.deepStrictEqual(argument, expected)
  })

describe('conditioned', () => {
  beforeEach(() => {
    definition.conditioned = true
    receiver = new Receiver(definition, fixtures.local, fixtures.bridge)
  })

  it('should test condition', async () => {
    const payload = { foo: 'bar' }
    await receiver.receive({ payload })

    assert.ok(
      fixtures.bridge.condition.mock.calls.some(
        (call) =>
          call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], payload)
      )
    )
    assert.ok(
      fixtures.local.invoke.mock.calls.some(
        (call) =>
          call.arguments.length === 2 &&
          isDeepStrictEqual(call.arguments[0], definition.operation) &&
          isDeepStrictEqual(call.arguments[1], { input: payload, trail: [hop] })
      )
    )
  })

  it('should not apply if condition is false', async () => {
    const payload = { reject: true }
    await receiver.receive({ payload })

    assert.strictEqual(fixtures.local.invoke.mock.callCount(), 0)
  })
})

describe('adaptive', () => {
  beforeEach(() => {
    definition.adaptive = true
    receiver = new Receiver(definition, fixtures.local, fixtures.bridge)
  })

  it('should apply', async () => {
    const payload = { reject: true }
    await receiver.receive({ payload })

    const request = await fixtures.bridge.request.mock.calls[0].result

    assert.ok(
      fixtures.local.invoke.mock.calls.some(
        (call) =>
          call.arguments.length === 2 &&
          isDeepStrictEqual(call.arguments[0], definition.operation) &&
          isDeepStrictEqual(call.arguments[1], request)
      )
    )
  })
})

describe('the chain', () => {
  /** what the receiver handed its operation */
  const request = () => fixtures.local.invoke.mock.calls.at(-1).arguments[1]

  it('should continue what the message carries', async () => {
    const hops = ['default.orders.place', '~default.orders.sync', 'default.billing.charge']

    await receiver.receive({ payload: { foo: 'bar' }, trail: hops })

    assert.deepStrictEqual(request().trail, [...hops, hop])
  })

  it('should start one where the message carries none', async () => {
    await receiver.receive({ payload: { foo: 'bar' } })

    assert.deepStrictEqual(request().trail, [hop])
  })

  // the message field is taken by name rather than merged, so what an adaptive bridge put
  // there — or what a peer sent — cannot stand in for the chain
  it('should not let a message stand a chain up', async () => {
    for (const trail of ['nope', 42, { 0: 'a' }, null]) {
      await receiver.receive({ payload: { foo: 'bar' }, trail })

      assert.deepStrictEqual(request().trail, [hop])
    }
  })

  it('should drop what is not a hop', async () => {
    await receiver.receive({
      payload: { foo: 'bar' },
      trail: ['default.orders.place', 7, null, {}]
    })

    assert.deepStrictEqual(request().trail, ['default.orders.place', hop])
  })
})

function resetCalls(target = [assert, clone, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

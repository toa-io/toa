'use strict'

const { describe, it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { merge } = require('@toa.io/generic')

const { Connector } = require('../src/connector')

// the fixtures are not connectors, so a dependency is recorded rather than linked
const depends = mock.method(Connector.prototype, 'depends', () => undefined)

const dependencies = (instance) => depends.mock.calls
  .filter((call) => call.this === instance)
  .map((call) => call.arguments[0])

const { Receiver } = require('../src/receiver')
const fixtures = require('./receiver.fixtures')

/** @type {toa.core.Receiver} */
let receiver

/** @type {toa.norm.component.Receiver} */
let definition

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

  assert.ok(fixtures.local.invoke.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], definition.operation) && isDeepStrictEqual(call.arguments[1], { input: payload })))
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

  const request = adaptive ? await fixtures.bridge.request.mock.calls[0].result : { input: payload }
  const expected = merge(clone(request), extension)

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

    assert.ok(fixtures.bridge.condition.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], payload)))
    assert.ok(fixtures.local.invoke.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], definition.operation) && isDeepStrictEqual(call.arguments[1], { input: payload })))
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

    assert.ok(fixtures.local.invoke.mock.calls.some((call) =>
      call.arguments.length === 2 &&
      isDeepStrictEqual(call.arguments[0], definition.operation) &&
      isDeepStrictEqual(call.arguments[1], request)))
  })
})

function resetCalls (target = [assert, clone, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

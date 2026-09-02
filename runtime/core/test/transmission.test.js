'use strict'

const { it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { Connector } = require('../src/connector')

// the fixtures are not connectors, so a dependency is recorded rather than linked
const depends = mock.method(Connector.prototype, 'depends', () => undefined)

const dependencies = (instance) => depends.mock.calls
  .filter((call) => call.this === instance)
  .map((call) => call.arguments[0])
const { Transmission } = require('../src/transmission')
const { codes } = require('../src/exceptions')
const fixtures = require('./transmission.fixtures')

let transmission

beforeEach(() => {
  resetCalls()
  depends.mock.resetCalls()
})

beforeEach(() => {
  transmission = new Transmission(fixtures.bindings)
})

it('should be instance of Connector depending on bindings', () => {
  assert.ok(transmission instanceof Connector)
  assert.ok(dependencies(transmission).some((one) => isDeepStrictEqual(one, fixtures.bindings)))
})

it('should pass arguments and return value', async () => {
  const request = { foo: 'bar' }
  const result = await transmission.request(request)

  assert.ok(fixtures.bindings[0].request.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], request)))
  assert.strictEqual(result, await fixtures.bindings[0].request.mock.calls[0].result)
})

it('should pick bindings sequentially', async () => {
  let result = await transmission.request()
  assert.strictEqual(result, await fixtures.bindings[0].request.mock.calls[0].result)

  result = await transmission.request({ pick: 1 })
  assert.strictEqual(result, await fixtures.bindings[1].request.mock.calls[0]?.result)
})

it('should throw exception if none succeeded', async () => {
  await assert.rejects(transmission.request({ pick: 5 }), (error) => { assert.partialDeepStrictEqual(error, { code: codes.Transmission }); return true })

  fixtures.bindings.forEach((binding) =>
    assert.ok(binding.request.mock.callCount() > 0))
})

function resetCalls (target = [assert, depends, dependencies, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

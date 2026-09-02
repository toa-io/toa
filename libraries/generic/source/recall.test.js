'use strict'

const { it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { generate } = require('randomstring')
const { recall } = require('../')

it('should be', async () => {
  assert.notStrictEqual(recall, undefined)
})

const context = { foo: generate() }

/** @type {import('node:test').Mock<(...args: any[]) => any>} */
let method

beforeEach(() => {
  resetCalls()

  method = /** @type {import('node:test').Mock<(...args: any[]) => any>} */
    mock.fn(function () { return this.foo })
})

it('should return function', async () => {
  const func = recall(context, method)

  assert.ok(func instanceof Function)
})

it('should return result', async () => {
  const func = recall(context, method)
  const output = await func()

  assert.deepStrictEqual(output, await method.mock.calls[0].result)
})

it('should call method within the context', async () => {
  const func = recall(context, method)
  const output = await func()

  assert.deepStrictEqual(output, context.foo)
})

it('should pass arguments', async () => {
  const args = [generate(), generate()]
  const func = recall(context, method)

  await func(...args)

  assert.ok(method.mock.calls.some((call) => isDeepStrictEqual(call.arguments, [...args])))
})

it('should re-call', async () => {
  const args1 = [generate(), generate()]
  const args2 = [generate(), generate(), generate()]
  const func = recall(context, method)

  await func(...args1)
  await func(...args2)

  method.mock.resetCalls()

  assert.strictEqual(method.mock.callCount(), 0)

  await recall(context)

  assert.ok(method.mock.calls.some((call) => isDeepStrictEqual(call.arguments, [...args1])))
  assert.ok(method.mock.calls.some((call) => isDeepStrictEqual(call.arguments, [...args2])))
})

it('should not trow on empty re-call', async () => {
  await assert.doesNotReject(recall(context))
})

it('should not re-call those thrown exceptions', async () => {
  
  method.mock.mockImplementationOnce(async () => 1, method.mock.callCount())
  method.mock.mockImplementationOnce(async () => { throw new Error() }, method.mock.callCount() + 1)

  const func = recall(context, method)

  await func()

  try {
    await func()
  } catch (e) {
    assert.notStrictEqual(e, undefined)
  }

  await recall(context)

  assert.strictEqual(method.mock.callCount(), 3)
})

function resetCalls (target = [assert, context], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

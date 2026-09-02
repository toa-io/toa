import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { timeout } from '../source/index.js'

import { lazy } from '../source/index.js'

it('should be', async () => {
  assert.notStrictEqual(lazy, undefined)
})

// noinspection JSValidateTypes
/** @type {import('node:test').Mock<(...args: any[]) => Promise<void>>} */
const action = mock.fn(async () => undefined)

// noinspection JSValidateTypes
/** @type {import('node:test').Mock<(...args: any[]) => Promise<void>>} */
const initialize = mock.fn(async () => undefined)

const value = generate()

class LazyInitialized {
  log = []

  action = lazy(this, this.#initialize, this.#action)

  async #initialize () {
    await timeout(1)
    await initialize()
    this.log.push('initializer')
  }

  async #action (...args) {
    await action(...args)
    this.log.push('action')

    return value
  }
}

let instance

beforeEach(() => {
  resetCalls()

  instance = new LazyInitialized()
})

it('should call initializer before action', async () => {
  await instance.action()

  assert.deepStrictEqual(instance.log, ['initializer', 'action'])
})

it('should pass arguments to action', async () => {
  const args = [generate(), generate()]

  await instance.action(...args)

  assert.ok(action.mock.calls.some((call) => isDeepStrictEqual(call.arguments, [...args])))
})

it('should return value', async () => {
  const output = await instance.action()

  assert.deepStrictEqual(output, value)
})

it('should call initializer once', async () => {
  await instance.action()
  await instance.action()

  assert.strictEqual(initialize.mock.callCount(), 1)
  assert.deepStrictEqual(instance.log, ['initializer', 'action', 'action'])
})

it('should call initializer once on concurrent calls', async () => {
  await Promise.all([instance.action(), instance.action()])

  assert.strictEqual(initialize.mock.callCount(), 1)
  assert.deepStrictEqual(instance.log, ['initializer', 'action', 'action'])
})

it('should call initializer once per instance', async () => {
  const instance2 = new LazyInitialized()

  await instance.action()
  await instance2.action()

  assert.strictEqual(initialize.mock.callCount(), 2)
})

// noinspection JSValidateTypes
/** @type {import('node:test').Mock<(...args: any[]) => Promise<void>>} */
const initialize2 = mock.fn(async () => undefined)

class InitializerSet {
  action = lazy(this, [this.#initialize1, this.#initialize2], this.#action)

  async #action () {

  }

  async #initialize1 () {
    await initialize()
  }

  async #initialize2 () {
    await initialize2()
  }
}

it('should run list of initializers', async () => {
  const instance = new InitializerSet()

  await instance.action()

  assert.ok(initialize.mock.callCount() > 0)
  assert.ok(initialize2.mock.callCount() > 0)
})

class InitializerIntersection {
  do = lazy(this, [this.#initialize1, this.#initialize2], this.#do)

  undo = lazy(this, this.#initialize2, this.#undo)

  async #do () {

  }

  async #undo () {

  }

  async #initialize1 () {
    await initialize()
  }

  async #initialize2 () {
    await initialize2()
  }
}

it('should call intersecting initializers once', async () => {
  resetCalls()

  const instance = new InitializerIntersection()

  await instance.do()
  await instance.undo()

  assert.strictEqual(initialize.mock.callCount(), 1)
  assert.strictEqual(initialize2.mock.callCount(), 1)
})

it('should call intersecting concurrent initializers once', async () => {
  resetCalls()

  const instance = new InitializerIntersection()

  await Promise.all([instance.do(), instance.undo()])

  assert.strictEqual(initialize.mock.callCount(), 1)
  assert.strictEqual(initialize2.mock.callCount(), 1)
})

class InitializersWithArguments {
  do = lazy(this, [this.#initialize1, this.#initialize2], this.#do)

  async #do (a, b, c) {}

  async #initialize1 () {
    await initialize(arguments)
  }

  async #initialize2 (a, b) {
    await initialize2(arguments)
  }
}

it('should pass arguments to initializers if expected', async () => {
  resetCalls()

  const instance = new InitializersWithArguments()

  await instance.do(1, 2, 3)

  assert.strictEqual(initialize.mock.callCount(), 1)

  const args = initialize.mock.calls[0].arguments[0]

  assert.deepStrictEqual(args.length, 0)

  assert.strictEqual(initialize2.mock.callCount(), 1)

  const args2 = initialize2.mock.calls[0].arguments[0]

  assert.deepStrictEqual(args2.length, 2)
})

it('should call conditions with different argument values', async () => {
  resetCalls()

  const instance = new InitializersWithArguments()

  await instance.do(1, 2, 3)
  await instance.do(1, 2)
  await instance.do(2, 2)

  assert.strictEqual(initialize.mock.callCount(), 1)
  assert.strictEqual(initialize2.mock.callCount(), 2)
})

class OrderedInitializers {
  log = []

  do = lazy(this, [this.#initialize1, this.#initialize2], async () => undefined)

  async #initialize1 () {
    await timeout(1)
    this.log.push(1)
  }

  async #initialize2 (a, b) {
    this.log.push(2)
  }
}

it('should call initializers sequentially', async () => {
  const instance = new OrderedInitializers()

  await instance.do()

  assert.deepStrictEqual(instance.log, [1, 2])
})

it('should override argument values', async () => {
  const method = /** @type {Function} */ mock.fn()

  class Test {
    do = lazy(this, this.#update, method)

    #update (foo, bar) {
      return [foo + ' updated', bar + ' updated']
    }
  }

  const test = new Test()
  const foo = generate()
  const bar = generate()

  await test.do(foo, bar)

  assert.ok(method.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], foo + ' updated') && isDeepStrictEqual(call.arguments[1], bar + ' updated')))
})

it('should partially override argument values', async () => {
  const method = /** @type {Function} */ mock.fn()

  class Test {
    do = lazy(this, this.#update, method)

    #update (foo, bar) {
      return [foo + ' updated']
    }
  }

  const test = new Test()
  const foo = generate()
  const bar = generate()

  await test.do(foo, bar)

  assert.ok(method.mock.calls.some((call) => call.arguments.length === 2 && isDeepStrictEqual(call.arguments[0], foo + ' updated') && isDeepStrictEqual(call.arguments[1], bar)))
})

describe('reset', () => {
  it('should be', async () => {
    assert.notStrictEqual(lazy.reset, undefined)
  })

  it('should reset initialization', async () => {
    const instance = new InitializerIntersection()

    await instance.do()
    await instance.undo()

    assert.strictEqual(initialize.mock.callCount(), 1)
    assert.strictEqual(initialize2.mock.callCount(), 1)

    lazy.reset(instance)

    await instance.do()
    await instance.undo()

    assert.strictEqual(initialize.mock.callCount(), 2)
    assert.strictEqual(initialize2.mock.callCount(), 2)
  })
})

function resetCalls (target = [assert, action, initialize, value, initialize2], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

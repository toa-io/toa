'use strict'

const { describe, it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { generate } = require('randomstring')
const { failsafe } = require('../')

it('should be', async () => {
  assert.notStrictEqual(failsafe, undefined)
})

beforeEach(() => {
  resetCalls()
})

const fn = /** @type {import('node:test').Mock<any>} */
  mock.fn(async () => generate())
const recover = /** @type {import('node:test').Mock<(...args: any[]) => Promise<any>>} */
  mock.fn(async () => true)

class FailsafeTest {
  doWithRecovery = failsafe(this, this.#recover, async (...args) => {
    return fn(...args)
  })

  doWithoutRecovery = failsafe(this, (...args) => {
    return fn(...args)
  })

  async #recover (exception) {
    return recover(exception)
  }
}

/** @type {FailsafeTest} */
let instance

beforeEach(() => {
  resetCalls()

  instance = new FailsafeTest()
})

for (const [_, method] of [
  ['with', 'doWithRecovery'],
  ['without', 'doWithoutRecovery']
])
   describe(`${_} recovery`, () => {
  it('should run fn', async () => {
    await instance[method]()

    assert.ok(fn.mock.callCount() > 0)
  })

  it('should return value', async () => {
    const value = await instance[method]()

    assert.deepStrictEqual(value, await fn.mock.calls[0].result)
  })

  it('should pass arguments', async () => {
    const args = [generate(), generate()]

    await instance[method](...args)

    assert.ok(fn.mock.calls.some((call) => isDeepStrictEqual(call.arguments, [...args])))
  })

  it('should call again', async () => {
    fn.mock.mockImplementationOnce(async () => { throw new Error() })

    await instance[method]()

    assert.strictEqual(fn.mock.callCount(), 2)
  })
})

describe('recovery function', () => {
  it('should recover on exception', async () => {
    fn.mock.mockImplementationOnce(async () => { throw new Error() })

    const value = await instance.doWithRecovery()

    assert.deepStrictEqual(value, await fn.mock.calls[1].result)
  })

  it('should throw on recovery failure', async () => {
    const exception = generate()

    fn.mock.mockImplementationOnce(async () => { throw exception })
    recover.mock.mockImplementationOnce(async () => false)

    await assert.rejects(instance.doWithRecovery(), (error) => { assert.deepStrictEqual(error, exception); return true })
  })

  it('should pass exception to recover', async () => {
    const exception = generate()

    fn.mock.mockImplementationOnce(async () => { throw exception })

    await instance.doWithRecovery()

    assert.ok(recover.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], exception)))
  })

  it('should call recover within context', async () => {
    class Test {
      foo = 1

      do = failsafe(this, this.recover, fn)

      recover () {
        assert.deepStrictEqual(this.foo, 1)
      }
    }

    const instance = new Test()

    fn.mock.mockImplementationOnce(() => { throw new Error() })

    instance.do()
  })
})

describe('disable', () => {
  it('should throw exception', async () => {
    const exception = generate()

    failsafe.disable(instance.doWithRecovery, instance.doWithoutRecovery)

    fn.mock.mockImplementation(async () => { throw exception })

    await assert.rejects(instance.doWithRecovery(), (error) => { assert.deepStrictEqual(error, exception); return true })
    await assert.rejects(instance.doWithoutRecovery(), (error) => { assert.deepStrictEqual(error, exception); return true })
  })
})

function resetCalls (target = [assert, fn, recover], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

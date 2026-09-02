'use strict'

const { it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { generate } = require('randomstring')
const { promex } = require('../')

const { track } = require('../')

it('should be', async () => {
  assert.notStrictEqual(track, undefined)
})

/** @type {toa.generic.Promex} */
let done

/** @type {toa.generic.Promex} */
let undone

const method1 = /** @type {import('node:test').Mock<(a: string, b: string) => Promise>} */
  mock.fn(async function () {
    // should execute in context
    assert.deepStrictEqual(this.ok, 1)

    return done
  })

const method2 = /** @type {import('node:test').Mock<(a: string, b: string) => Promise>} */
  mock.fn(async function () { return undone })

class Test {
  ok = 1
  do = track(this, method1)
  undo = track(this, method2)
}

/** @type {Test} */
let test

beforeEach(() => {
  resetCalls()

  done = promex()
  undone = promex()
  test = new Test()
})

it('should return function', async () => {
  assert.ok(test.do instanceof Function)
})

it('should execute method', async () => {
  const result = generate()

  done.resolve(result)

  const args = [generate(), generate()]

  const output = await test.do(...args)

  assert.ok(method1.mock.calls.some((call) => isDeepStrictEqual(call.arguments, [...args])))
  assert.deepStrictEqual(output, result)
})

it('should track method execution', async () => {
  
  setImmediate(async () => {
    setImmediate(() => {
      done.resolve()

      assert.deepStrictEqual(finished, false)

      setImmediate(() => {
        assert.deepStrictEqual(finished, true)
      })
    })

    let finished = false

    await track(test)

    finished = true
  })

  await test.do()
})

it('should track multiple methods', async () => {
   // + method1

  setImmediate(async () => {
    setImmediate(() => {
      done.resolve()

      assert.deepStrictEqual(finished, false)

      setImmediate(() => {
        undone.resolve()

        assert.deepStrictEqual(finished, false)
        setImmediate(() => assert.deepStrictEqual(finished, true))
      })
    })

    let finished = false

    await track(test)

    finished = true
  })

  await Promise.all([test.do(), test.undo()])
})

it('should resolve if methods haven\'t been called', async () => {
  await track(this)
})

it('should handle exceptions', async () => {
  
  const exception = new Error(generate())

  class Bad {
    do = track(this, async () => { throw exception })
  }

  const b = new Bad()

  try {
    await b.do()
  } catch (e) {
    assert.deepStrictEqual(e, exception)
  }

  await assert.doesNotReject(track(b))
})

function resetCalls (target = [assert, method1, method2], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

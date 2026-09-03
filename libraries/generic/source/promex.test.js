import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'

import { promex } from '../source/index.js'

it('should be', async () => {
  assert.notStrictEqual(promex, undefined)
})

/** @type {toa.generic.Promex} */
let instance

beforeEach(() => {
  instance = promex()
})

it('should return promise', async () => {
  assert.ok(instance instanceof Promise)
})

it('should resolve', async () => {
  assert.notStrictEqual(instance.resolve, undefined)

  let a = 1

  setImmediate(() => {
    a = 2
    instance.resolve()
  })

  assert.deepStrictEqual(a, 1)

  await instance

  assert.deepStrictEqual(a, 2)
})

it('should resolve value', async () => {
  const value = generate()

  setImmediate(() => instance.resolve(value))

  const resolved = await instance

  assert.deepStrictEqual(resolved, value)
})

it('should reject', async () => {
  assert.notStrictEqual(instance.reject, undefined)

  setImmediate(() => instance.reject(new Error('test')))

  await assert.rejects(instance, (error) => /test/.test(error.message))
})

describe('callback', () => {
  it('should be', async () => {
    assert.notStrictEqual(instance.callback, undefined)
  })

  it('should reject if error in defined', async () => {
    const error = new Error()
    const result = undefined

    setImmediate(() => instance.callback(error, result))

    await assert.rejects(instance, error)
  })

  it('should resolve to result in no error defined', async () => {
    const error = undefined
    const result = generate()

    setImmediate(() => instance.callback(error, result))

    await assert.deepStrictEqual(await instance, result)
  })

  for (const error of [undefined, null])
     it(`should resolve to result if error is ${error}`, async () => {
    const result = generate()

    setImmediate(() => instance.callback(error, result))

    await assert.deepStrictEqual(await instance, result)
  })
})

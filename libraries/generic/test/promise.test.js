'use strict'

const { generate } = require('randomstring')

const { promise } = require('../src')

it('should be', async () => {
  expect(promise).toBeDefined()
})

/** @type {toa.generic.promise.Exposed} */
let instance

beforeEach(() => {
  instance = promise()
})

it('should return promise', async () => {
  expect(instance).toBeInstanceOf(Promise)
})

it('should resolve', async () => {
  expect(instance.resolve).toBeDefined()

  let a = 1

  setImmediate(() => {
    a = 2
    instance.resolve()
  })

  expect(a).toStrictEqual(1)

  await instance

  expect(a).toStrictEqual(2)
})

it('should resolve value', async () => {
  const value = generate()

  setImmediate(() => {
    instance.resolve(value)
  })

  const resolved = await instance

  expect(resolved).toStrictEqual(value)
})

it('should reject', async () => {
  expect(instance.reject).toBeDefined()

  setImmediate(() => {
    instance.reject(new Error('test'))
  })

  await expect(instance).rejects.toThrow('test')
})

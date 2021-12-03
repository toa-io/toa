'use strict'

const { Locator } = require('@toa.io/core')
const { Storage } = require('@toa.io/storages.mongodb')
const { newid } = require('@toa.io/gears')

const locator = new Locator({ domain: 'credits', name: 'balance' })
const storage = new Storage(locator)

beforeAll(async () => {
  await expect(storage.connect()).resolves.not.toThrow()
})

afterAll(async () => {
  await storage.disconnect()
})

it('should perform operations', async () => {
  const id = newid()

  await storage.add({ id, foo: 'bar' })
  const record = await storage.get({ id })

  expect(record).toStrictEqual({ id, foo: 'bar', _version: 1 })
})

'use strict'

const { generate } = require('randomstring')

const { Storage } = require('../src/storage')

let storage

beforeAll(() => {
  storage = new Storage()
})

it('should get null', async () => {
  const result = await storage.get()

  expect(result).toBeNull()
})

it('should add', async () => {
  const object = { id: generate() }
  const result = await storage.add(object)

  expect(result).toStrictEqual(true)
})

it('should not really add', async () => {
  const object = { id: generate() }

  await storage.add(object)

  const result = await storage.get({ query: { id: object.id } })

  expect(result).toBeNull()
})

it('should store', async () => {
  const object = { id: generate() }

  const result = await storage.store(object)

  expect(result).toStrictEqual(true)
})

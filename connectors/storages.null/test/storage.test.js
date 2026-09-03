import { it, before } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'

import { Storage } from '../src/storage.js'

let storage

before(() => {
  storage = new Storage()
})

it('should get null', async () => {
  const result = await storage.get()

  assert.strictEqual(result, null)
})

it('should add', async () => {
  const object = { id: generate() }
  const result = await storage.add(object)

  assert.deepStrictEqual(result, true)
})

it('should not really add', async () => {
  const object = { id: generate() }

  await storage.add(object)

  const result = await storage.get({ query: { id: object.id } })

  assert.strictEqual(result, null)
})

it('should store', async () => {
  const object = { id: generate() }

  const result = await storage.store(object)

  assert.deepStrictEqual(result, true)
})

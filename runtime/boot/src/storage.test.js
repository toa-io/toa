import { it } from 'node:test'
import assert from 'node:assert/strict'

import { Locator } from '@toa.io/core'

import { storage } from './storage.js'

const manifest = (entity) => ({
  locator: new Locator('one', 'test'),
  path: import.meta.dirname,
  entity
})

const schema = { properties: {} }

it('should not create a storage for a component that stores nothing', async () => {
  assert.equal(await storage(manifest(undefined), false), undefined)
})

it('should refuse migrations a storage does not apply', async () => {
  const entity = {
    schema,
    storage: '@toa.io/storages.null',
    migrations: [{ id: '0001', steps: [] }]
  }

  await assert.rejects(
    storage(manifest(entity), false),
    /declares migrations, which storage '@toa.io\/storages.null' does not apply/
  )
})

it('should accept inherited migrations a storage does not apply', async () => {
  const entity = {
    schema,
    storage: '@toa.io/storages.null',
    migrations: [{ id: 'system:0001', steps: [], prototype: 'system' }]
  }

  assert.notEqual(await storage(manifest(entity), false), undefined)
})

it('should accept a storage with no migrations', async () => {
  const entity = { schema, storage: '@toa.io/storages.null' }

  assert.notEqual(await storage(manifest(entity), false), undefined)
})

it('should accept migrations a storage applies', async () => {
  const entity = {
    schema,
    storage: '@toa.io/storages.mongodb',
    migrations: [{ id: '0001', steps: [] }]
  }

  assert.notEqual(await storage(manifest(entity), false), undefined)
})

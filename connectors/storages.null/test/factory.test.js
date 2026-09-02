import { it, before } from 'node:test'
import assert from 'node:assert/strict'

import { Factory } from '../src/factory.js'
import { Storage } from '../src/storage.js'

let factory

before(() => {
  factory = new Factory()
})

it('should create storage', () => {
  const storage = factory.storage()

  assert.ok(storage instanceof Storage)
})

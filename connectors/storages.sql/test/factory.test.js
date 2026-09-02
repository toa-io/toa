import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { Locator } from '@toa.io/core'

import { Storage } from '../src/storage.js'
import { Migration } from '../src/migration.js'
import { Factory } from '../src/index.js'

/** @type {toa.sql.Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

it('should be', () => {
  assert.notStrictEqual(Factory, undefined)
})

it('should create storage', () => {
  const name = generate()
  const namespace = generate()
  const locator = new Locator(name, namespace)

  // use default pointer values
  process.env.TOA_DEV = '1'

  const storage = factory.storage(locator)

  delete process.env.TOA_DEV

  assert.notStrictEqual(storage, undefined)
  assert.ok(storage instanceof Storage)
})

it('should create migration', () => {
  const migration = factory.migration('pg')

  assert.ok(migration instanceof Migration)
})

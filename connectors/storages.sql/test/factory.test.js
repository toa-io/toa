'use strict'

const { it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

const { Storage } = require('../src/storage')
const { Migration } = require('../src/migration')
const { Factory } = require('../src')

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

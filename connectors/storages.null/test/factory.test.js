'use strict'

const { it, before } = require('node:test')
const assert = require('node:assert/strict')

const { Factory } = require('../src/factory')
const { Storage } = require('../src/storage')

let factory

before(() => {
  factory = new Factory()
})

it('should create storage', () => {
  const storage = factory.storage()

  assert.ok(storage instanceof Storage)
})

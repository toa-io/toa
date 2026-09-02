'use strict'

const { it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const { Factory } = require('../')

it('should be', async () => {
  assert.ok(Factory instanceof Function)
})

/** @type {Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

it('should implement aspect()', async () => {
  assert.ok(factory.aspect instanceof Function)
})

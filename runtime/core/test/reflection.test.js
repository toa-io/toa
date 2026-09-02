'use strict'

const { it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')
const { Reflection, Connector } = require('../')

it('should export', () => {
  assert.notStrictEqual(Reflection, undefined)
})

/** @type {toa.core.Reflection<string>} */
let reflection

const value = generate()

/** @type {toa.core.reflection.Source<string>} */
const source = async () => value

beforeEach(() => {
  reflection = new Reflection(source)
})

it('should be a Connector', () => {
  assert.ok(reflection instanceof Connector)
})

it('should reflect', async () => {
  await reflection.connect()

  assert.deepStrictEqual(reflection.value, value)
})

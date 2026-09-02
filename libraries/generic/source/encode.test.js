'use strict'

const { it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')

const { encode, decode, random } = require('../')

let object

beforeEach(() => {
  object = { [generate()]: generate() }
})

it('should exist', () => {
  assert.notStrictEqual(encode, undefined)
  assert.notStrictEqual(decode, undefined)
})

it('should encode object', () => {
  const string = encode(object)

  assert.deepStrictEqual(typeof string, 'string')
})

it('should decode object', () => {
  const string = encode(object)
  const decoded = decode(string)

  assert.deepStrictEqual(decoded, object)
})

it('should encode string', () => {
  const string = generate()
  const encoded = encode(string)
  const decoded = decode(encoded)

  assert.deepStrictEqual(decoded, string)
})

it('should encode number', () => {
  const number = random()
  const encoded = encode(number)
  const decoded = decode(encoded)

  assert.deepStrictEqual(decoded, number)
})

import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'

import { encode, decode, random } from '../source/index.js'

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

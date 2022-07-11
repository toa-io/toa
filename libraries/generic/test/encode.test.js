'use strict'

const { generate } = require('randomstring')

const { encode, decode, random } = require('../')

let object

beforeEach(() => {
  object = { [generate()]: generate() }
})

it('should exist', () => {
  expect(encode).toBeDefined()
  expect(decode).toBeDefined()
})

it('should encode object', () => {
  const string = encode(object)

  expect(typeof string).toStrictEqual('string')
})

it('should decode object', () => {
  const string = encode(object)
  const decoded = decode(string)

  expect(decoded).toStrictEqual(object)
})

it('should encode string', () => {
  const string = generate()
  const encoded = encode(string)
  const decoded = decode(encoded)

  expect(decoded).toStrictEqual(string)
})

it('should encode number', () => {
  const number = random()
  const encoded = encode(number)
  const decoded = decode(encoded)

  expect(decoded).toStrictEqual(number)
})

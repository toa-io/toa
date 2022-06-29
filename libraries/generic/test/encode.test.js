'use strict'

const { generate } = require('randomstring')

const { encode, decode } = require('../')

let object

beforeEach(() => {
  object = { [generate()]: generate() }
})

it('should exist', () => {
  expect(encode).toBeDefined()
  expect(decode).toBeDefined()
})

it('should encode', () => {
  const string = encode(object)

  expect(typeof string).toStrictEqual('string')
})

it('should decode', () => {
  const string = encode(object)
  const decoded = decode(string)

  expect(decoded).toStrictEqual(object)
})

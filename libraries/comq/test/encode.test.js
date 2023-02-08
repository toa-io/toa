'use strict'

const { generate } = require('randomstring')
const { pack } = require('msgpackr')

const { encode } = require('../src/encode')

it('should be', async () => {
  expect(encode).toBeDefined()
})

it('should throw if encoding is not supported', async () => {
  const value = 1
  const encoding = 'wtf/' + generate()

  expect(() => encode(value, encoding)).toThrow('not supported')
})

it('should encode as json', async () => {
  const value = { [generate()]: generate() }
  const buffer = encode(value, 'application/json')

  const json = JSON.stringify(value)
  const expected = Buffer.from(json)

  expect(buffer).toStrictEqual(expected)
})

it('should encode as msgpack', async () => {
  const value = { [generate()]: generate() }
  const packed = pack(value)
  const buffer = encode(value, 'application/msgpack')

  expect(buffer).toStrictEqual(packed)
})

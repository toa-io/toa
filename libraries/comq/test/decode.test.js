'use strict'

const { generate } = require('randomstring')
const { pack } = require('msgpackr')

const { decode } = require('../src/decode')

it('should be', async () => {
  expect(decode).toBeDefined()
})

it('should decode application/json', async () => {
  const object = { [generate()]: generate() }
  const json = JSON.stringify(object)
  const content = Buffer.from(json)
  const contentType = 'application/json'
  const properties = { contentType }
  const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }

  const decoded = decode(message)

  expect(decoded).toStrictEqual(object)
})

it('should decode application/msgpack', async () => {
  const object = { [generate()]: generate() }
  const content = pack(object)
  const contentType = 'application/msgpack'
  const properties = { contentType }
  const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }

  const decoded = decode(message)

  expect(decoded).toStrictEqual(object)
})

it('should return buffer if content type is not defined', async () => {
  const object = { [generate()]: generate() }
  const json = JSON.stringify(object)
  const content = Buffer.from(json)
  const properties = {}
  const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }

  const buffer = decode(message)
  const string = buffer.toString()
  const decoded = JSON.parse(string)

  expect(decoded).toStrictEqual(object)
})

it.each(['application/octet-stream', 'wtf/' + generate()])('should return buffer if content type is %s', async (type) => {
  const object = { [generate()]: generate() }
  const json = JSON.stringify(object)
  const content = Buffer.from(json)
  const contentType = type
  const properties = { contentType }
  const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }

  const buffer = decode(message)
  const string = buffer.toString()
  const decoded = JSON.parse(string)

  expect(decoded).toStrictEqual(object)
})

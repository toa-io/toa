'use strict'

const { generate } = require('randomstring')

const { encode } = require('../src/encode')
const { encodings } = require('./encodings')
const mock = require('./connection.mock')

const { IO } = require('../src/io')

/** @type {comq.IO} */
let io

/** @type {jest.MockedObject<comq.Connection>} */
let connection

/** @type {jest.MockedObject<comq.Channel>} */
let output

beforeEach(async () => {
  jest.clearAllMocks()

  connection = mock.connection()
  io = new IO(connection)

  await io.emit(exchange, payload)

  output = await connection.out.mock.results[0].value
})

it('should be', async () => {
  expect(io.emit).toBeDefined()
})

const exchange = generate()
const payload = generate()

it('should create output channel', async () => {
  expect(connection.out).toHaveBeenCalled()
  expect(output).toBeDefined()
})

it('should publish to an exchange', async () => {
  expect(output.publish).toHaveBeenCalledTimes(1)

  const args = output.publish.mock.calls[0]

  expect(args[0]).toStrictEqual(exchange)
})

it('should encode message as msgpack by default', async () => {
  const encoding = 'application/msgpack'
  const buf = encode(payload, encoding)
  const [, buffer, properties] = output.publish.mock.calls[0]

  expect(buffer).toStrictEqual(buf)
  expect(properties.contentType).toStrictEqual(encoding)
})

it.each(encodings)('should publish message encoded as %s', async (encoding) => {
  await io.emit(exchange, payload, encoding)

  const buf = encode(payload, encoding)
  const [, buffer, properties] = output.publish.mock.calls[1]

  expect(buffer).toStrictEqual(buf)
  expect(properties.contentType).toStrictEqual(encoding)
})

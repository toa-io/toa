'use strict'

const { generate } = require('randomstring')
const { encode } = require('../src/encode')

const mock = require('./connection.mock')
const { encodings } = require('./encodings')

const { IO } = require('../src/io')

/** @type {comq.IO} */
let io

/** @type {jest.MockedObject<comq.Connection>} */
let connection

beforeEach(async () => {
  jest.clearAllMocks()

  connection = mock.connection()
  io = new IO(connection)
})

it('should be', async () => {
  expect(io.consume).toBeDefined()
})

const exchange = generate()
const group = generate()
const consumer = jest.fn(() => undefined)

/** @type {jest.MockedObject<comq.Channel>} */
let input

beforeEach(async () => {
  jest.clearAllMocks()

  await io.consume(exchange, group, consumer)

  input = await connection.createInputChannel.mock.results[0]?.value
})

it('should initialize input channel', async () => {
  expect(connection.createInputChannel).toHaveBeenCalled()
})

it('should subscribe', async () => {
  expect(input).toBeDefined()

  const queue = exchange + '..' + group

  expect(input.subscribe).toHaveBeenCalledWith(exchange, queue, expect.any(Function))
})

it.each(encodings)('should pass decoded event (%s)', async (contentType) => {
  const payload = generate()
  const content = encode(payload, contentType)
  const properties = { contentType }
  const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }
  const callback = input.subscribe.mock.calls[0][2]

  await callback(message)

  expect(consumer).toHaveBeenCalledWith(payload)
})

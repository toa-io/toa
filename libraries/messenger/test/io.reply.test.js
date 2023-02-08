'use strict'

// region setup

const { randomBytes } = require('node:crypto')
const { generate } = require('randomstring')
const { encode } = require('../src/encode')

const mock = require('./connection.mock')
const { IO } = require('../src/io')

/** @type {toa.messenger.IO} */
let io

/** @type {jest.MockedObject<toa.messenger.Connection>} */
let connection

beforeEach(async () => {
  jest.clearAllMocks()

  connection = mock.connection()
  io = new IO(connection)
})

const queue = generate()
const produce = jest.fn(async () => generate())

// endregion

describe.each(['in', 'out'])('%sput channel', (key) => {
  const name = key + 'put'

  it(`should create ${name} channel`, async () => {
    await io.reply(queue, produce)

    expect(connection[key]).toHaveBeenCalled()
  })

  it(`should create ${name} channel once`, async () => {
    const label1 = generate()
    const label2 = generate()

    await io.reply(label1, produce)
    await io.reply(label2, produce)

    expect(connection[key].mock.calls.length).toStrictEqual(1)
  })

  it(`should concurrently create ${name} channel once`, async () => {
    const label1 = generate()
    const label2 = generate()

    await Promise.all([io.reply(label1, produce), io.reply(label2, produce)])

    expect(connection[key].mock.calls.length).toStrictEqual(1)
  })
})

describe('queues', () => {
  /** @type {jest.MockedObject<toa.messenger.Channel>} */
  let input

  beforeEach(async () => {
    await io.reply(queue, produce)

    input = await connection.in.mock.results[0].value
  })

  it('should consume durable queue', async () => {
    expect(input.consume).toHaveBeenCalledWith(queue, true, expect.any(Function))
  })

  it('should throw if message is missing replyTo', async () => {
    const content = randomBytes(10)
    const properties = {}
    const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }
    const producer = input.consume.mock.calls[0][2]

    await expect(producer(message)).rejects.toThrow('is missing `replyTo` property')
  })
})

describe('encoding', () => {
  /** @type {jest.MockedObject<toa.messenger.Channel>} */
  let input

  /** @type {jest.MockedObject<toa.messenger.Channel>} */
  let output

  const encodings = ['application/msgpack', 'application/json']

  beforeEach(async () => {
    await io.reply(queue, produce)

    input = await connection.in.mock.results[0].value
    output = await connection.out.mock.results[0].value
  })

  it.each(encodings)('should decode message content (%s)', async (encoding) => {
    const value = { [generate()]: generate() }
    const content = encode(value, encoding)
    const properties = { contentType: encoding, replyTo: generate() }
    const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }

    const producer = input.consume.mock.calls[0][2]

    await producer(message)

    expect(produce).toHaveBeenCalledWith(value)
  })

  it.each(encodings)('should encode reply with same encoding (%s)', async (encoding) => {
    const request = { [generate()]: generate() }
    const content = encode(request, encoding)

    const properties = {
      replyTo: generate(),
      correlationId: generate(),
      contentType: encoding
    }

    const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }
    const producer = input.consume.mock.calls[0][2]

    await producer(message)

    const result = await produce.mock.results[0].value

    expect(result).toBeDefined()

    const reply = encode(result, encoding)

    const props = {
      correlationId: properties.correlationId,
      contentType: properties.contentType
    }

    expect(output.deliver).toHaveBeenCalledWith(properties.replyTo, reply, props)
  })

  it.each(['specified', 'supported'])('should pass buffer if encoding format not %s', async (problem) => {
    const content = randomBytes(10)
    const properties = { replyTo: generate() }

    if (problem === 'supported') properties.contentType = 'wtf/' + generate()

    const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }
    const producer = input.consume.mock.calls[0][2]

    produce.mockImplementationOnce(async () => randomBytes(8))

    await producer(message)

    expect(produce).toHaveBeenCalledWith(content)
  })

  it('should set octet-stream for Buffer reply', async () => {
    const request = { [generate()]: generate() }
    const content = encode(request, 'application/msgpack')

    const properties = {
      replyTo: generate(),
      correlationId: generate(),
      contentType: 'application/msgpack'
    }

    const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }
    const producer = input.consume.mock.calls[0][2]
    const buffer = randomBytes(8)

    produce.mockImplementationOnce(async () => buffer)

    await producer(message)

    expect(output.deliver)
      .toHaveBeenCalledWith(
        expect.any(String),
        buffer,
        expect.objectContaining({ contentType: 'application/octet-stream' })
      )
  })

  it('should throw if request is missing contentType and reply is not a Buffer', async () => {
    const content = randomBytes(8)

    const properties = {
      replyTo: generate(),
      correlationId: generate()
    }

    const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }
    const producer = input.consume.mock.calls[0][2]

    await expect(producer(message)).rejects.toThrow('must be of Buffer type')
  })
})

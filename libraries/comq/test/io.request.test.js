'use strict'

// region setup

const { randomBytes } = require('node:crypto')
const { generate } = require('randomstring')
const { encode } = require('../src/encode')

const mock = require('./connection.mock')
const { IO } = require('../src/io')

/** @type {toa.comq.IO} */
let io

/** @type {jest.MockedObject<toa.comq.Connection>} */
let connection

beforeEach(async () => {
  jest.clearAllMocks()

  connection = mock.connection()
  io = new IO(connection)
})

// endregion

it('should be', async () => {
  expect(io.request).toBeDefined()
})

const queue = generate()
const payload = { [generate()]: generate() }

/** @type {jest.MockedObject<toa.comq.Channel>} */
let output
let promise

const REPLY = new RegExp(`^${queue}..[0-9a-f]+$`)

beforeEach(async () => {
  promise = io.request(queue, payload)
  output = await connection.out.mock.results[0]?.value
})

it('should initialize output channel', async () => {
  expect(connection.out).toHaveBeenCalled()
})

it('should consume transient queue', async () => {
  expect(output.consume).toHaveBeenCalledWith(expect.stringMatching(REPLY), false, expect.any(Function))
})

describe('deliver', () => {
  let call

  beforeEach(() => {
    expect(output.deliver).toHaveBeenCalledTimes(1)
    expect(output.consume).toHaveBeenCalledTimes(1)

    call = output.deliver.mock.calls[0]
  })

  it('should deliver message to the queue', async () => {
    expect(call[0]).toStrictEqual(queue)
  })

  it('should set correlationId', async () => {
    const properties = call[2]

    expect(typeof properties.correlationId).toStrictEqual('string')
  })

  it('should set replyTo', async () => {
    const request = call[2]
    const queue = output.consume.mock.calls[0][0]

    expect(request.replyTo).toStrictEqual(queue)
  })

  it('should encode message with msgpack by default', async () => {
    const contentType = 'application/msgpack'
    const buffer = encode(payload, contentType)

    expect(call[1]).toStrictEqual(buffer)
    expect(call[2]).toMatchObject({ contentType })
  })

  it('should throw if encoding is not supported', async () => {
    const encoding = 'wtf/' + generate()

    await expect(io.request(queue, payload, encoding)).rejects.toThrow('is not supported')
  })

  it('should send buffer', async () => {
    output.deliver.mockClear()

    const payload = randomBytes(8)

    setImmediate(reply)

    await io.request(queue, payload)

    const [, buffer, properties] = output.deliver.mock.calls[0]

    expect(buffer).toStrictEqual(payload)
    expect(properties.contentType).toStrictEqual('application/octet-stream')
  })

  it('should send buffer with specified encoding', async () => {
    output.deliver.mockClear()

    const payload = randomBytes(8)
    const encoding = 'wtf/' + generate()

    setImmediate(reply)
    await io.request(queue, payload, encoding)

    const [, buffer, properties] = output.deliver.mock.calls[0]

    expect(buffer).toStrictEqual(payload)
    expect(properties.contentType).toStrictEqual(encoding)
  })
})

describe('reply', () => {
  it.each([undefined, 'application/octet-stream'])('should return raw content if encoding is %s', async (contentType) => {
    const content = randomBytes(8)

    await reply(content, contentType)

    const output = await promise

    expect(output).toStrictEqual(content)
  })

  const encodings = ['application/msgpack', 'application/json']

  it.each(encodings)('should decode %s', async (contentType) => {
    const value = generate()
    const content = encode(value, contentType)

    await reply(content, contentType)

    const output = await promise

    expect(output).toStrictEqual(value)
  })
})

const reply = async (content = randomBytes(8), contentType = undefined) => {
  const correlationId = output.deliver.mock.calls[0][2].correlationId
  const properties = { correlationId, contentType }
  const callback = output.consume.mock.calls[0][2]
  const message = /** @type {import('amqplib').ConsumeMessage} */ { content, properties }

  await callback(message)
}

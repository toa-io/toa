'use strict'

const { generate } = require('randomstring')
const { promex } = require('@toa.io/libraries/generic')

const mock = require('./connection.mock')
const { IO } = require('../src/io')
const { randomBytes } = require('crypto')

/** @type {comq.IO} */
let io

/** @type {jest.MockedObject<comq.Connection>} */
let connection

/** @type {jest.MockedObject<comq.Channel>} */
let input

beforeEach(async () => {
  jest.clearAllMocks()

  input = undefined

  connection = mock.connection()
  io = new IO(connection)
})

describe('seal', () => {
  it('should be', async () => {
    expect(io.seal).toBeDefined()
  })

  it('should seal input channel', async () => {
    await reply()
    await io.close()

    expect(input.seal).toHaveBeenCalled()
  })

  it('should not throw if channels haven\'t been initialized', async () => {
    await expect(io.seal()).resolves.not.toThrow()
  })

  it('should not seal input channel twice', async () => {
    await reply()
    await io.seal()
    await io.close()

    expect(input.seal).toHaveBeenCalledTimes(1)
  })
})

describe('close', () => {
  it('should seal input channel', async () => {
    await reply()
    await io.close()

    expect(input.seal).toHaveBeenCalled()
  })

  it('should not throw if channels haven\'t been initialized', async () => {
    await expect(io.close()).resolves.not.toThrow()
  })

  it('should wait for event processing completion', async () => {
    const promise = /** @type {Promise<void>} */ promex()
    const queue = generate()
    const group = generate()
    const consumer = jest.fn(async () => promise)

    await io.consume(queue, group, consumer)

    const input = await connection.createInputChannel.mock.results[0].value
    const callback = input.subscribe.mock.calls[0][2]

    const content = randomBytes(8)
    const properties = {}
    const message = { content, properties }

    callback(message)

    expect(consumer).toHaveBeenCalled()

    let closed = false
    let resolved = false

    setImmediate(() => {
      expect(closed).toStrictEqual(false)

      resolved = true
      promise.resolve()
    })

    await io.close()

    closed = true

    expect(resolved).toStrictEqual(true)
  })

  it('should wait for request processing completion', async () => {
    const promise = /** @type {Promise<void>} */ promex()
    const producer = jest.fn(async () => promise)

    await reply(/** @type {Function} */ producer)

    const input = await connection.createInputChannel.mock.results[0].value
    const callback = input.consume.mock.calls[0][2]

    const content = generate()
    const properties = { replyTo: generate(), contentType: 'text/plain' }
    const message = { content, properties }

    callback(message)

    expect(producer).toHaveBeenCalled()

    let closed = false
    let resolved = false

    setImmediate(() => {
      expect(closed).toStrictEqual(false)

      resolved = true
      promise.resolve(generate())
    })

    await io.close()

    closed = true

    expect(resolved).toStrictEqual(true)
  })

  it('should close connection', async () => {
    await io.close()

    expect(connection.close).toHaveBeenCalled()
  })
})

/**
 * @param {Function} [producer]
 * @return {Promise<void>}
 */
const reply = async (producer = () => undefined) => {
  // initialize both channels
  await io.reply(generate(), producer)

  input = await connection.createInputChannel.mock.results[0].value
}

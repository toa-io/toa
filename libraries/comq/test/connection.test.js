'use strict'

// region setup

const { generate } = require('randomstring')

const { amqplib } = require('./amqplib.mock')
const mock = { amqplib }

jest.mock('amqplib', () => mock.amqplib)
jest.mock('../src/channel')

const { Connection } = require('../src/connection')
const { /** @type {jest.MockedClass<comq.Channel>} */ Channel } = require('../src/channel')

it('should be', async () => {
  expect(Connection).toBeDefined()
})

/** @type {comq.Connection} */
let connection

const url = generate()

beforeEach(() => {
  jest.clearAllMocks()

  connection = new Connection(url)
})

const TRANSIENT_ERRORS = [
  ['ECONNREFUSED', { code: 'ECONNREFUSED' }],
  ['Socket closed', { message: 'Socket closed abruptly during opening handshake' }]
]

// endregion

describe('initial connection', () => {
  it('should connect', async () => {
    await connection.open()

    expect(amqplib.connect).toHaveBeenCalled()
    expect(amqplib.connect).toHaveBeenCalledWith(url)
  })

  it.each(TRANSIENT_ERRORS)('should reconnect on %s',
    async (_, error) => {
      amqplib.connect.mockImplementationOnce(async () => { throw error })

      await expect(connection.open()).resolves.not.toThrow()

      expect(amqplib.connect).toHaveBeenCalledTimes(2)
    })

  it('should throw if error is permanent', async () => {
    const error = new Error()

    amqplib.connect.mockImplementationOnce(async () => { throw error })

    await expect(connection.open()).rejects.toThrow(error)
  })
})

describe('reconnection', () => {
  /** @type {jest.MockedObject<import('amqplib').Connection>} */
  let conn

  beforeEach(async () => {
    await connection.open()

    conn = await amqplib.connect.mock.results[0].value
  })

  it('should reconnect on error', async () => {
    expect(amqplib.connect).toHaveBeenCalledTimes(1)

    // const clear = jest.spyOn(conn, 'removeAllListeners')
    const error = { message: generate() }

    conn.emit('close', error)

    expect(conn.removeAllListeners).toHaveBeenCalled()
    expect(amqplib.connect).toHaveBeenCalledTimes(2)
  })

  it('should not reconnect without error', async () => {
    conn.emit('close')

    expect(amqplib.connect).toHaveBeenCalledTimes(1)
  })

  it('should prevent process crash', async () => {
    expect(conn.on).toHaveBeenCalledWith('error', expect.any(Function))
  })
})

describe.each([['Input', 'createChannel'], ['Output', 'createConfirmChannel']])('%s',
  (key, method) => {
    /** @type {jest.MockedObject<import('amqplib').Connection>} */
    let amqp

    /** @type {import('amqplib').Channel} */
    let chan

    /** @type {comq.Channel} */
    let channel

    beforeEach(async () => {
      await connection.open()

      amqp = await amqplib.connect.mock.results[0].value
      channel = await connection['create' + key + 'Channel']()

      expect(amqp[method]).toHaveBeenCalled()

      chan = await amqp[method].mock.results[0].value
    })

    it('should create channel', async () => {
      expect(channel).toBeInstanceOf(Channel)
      expect(Channel).toHaveBeenCalledWith(chan)
    })

    if (key === 'Input') {
      it('should set prefetch', async () => {
        expect(chan.prefetch).toHaveBeenCalledWith(300)
      })
    }
  })

it('should close connection', async () => {
  await connection.open()
  await connection.close()

  const amqp = await amqplib.connect.mock.results[0].value

  expect(amqp.close).toHaveBeenCalled()
})

describe('diagnostics', () => {
  beforeEach(async () => {
    await connection.open()
  })

  it('should emit `open` event', async () => {
    let captured = false

    connection.diagnose('open', () => (captured = true))

    await connection.open()

    expect(captured).toStrictEqual(true)
  })

  it('should re-emit `close` event', async () => {
    let captured

    connection.diagnose('close', (error) => (captured = error))

    const amqp = await amqplib.connect.mock.results[0].value
    const error = generate()

    amqp.emit('close', error)

    expect(captured).toStrictEqual(error)
  })
})

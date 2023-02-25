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

// endregion

it('should connect', async () => {
  await connection.connect()

  expect(amqplib.connect).toHaveBeenCalled()
  expect(amqplib.connect).toHaveBeenCalledWith(url)
})

const TRANSIENT_ERRORS = [
  { code: 'ECONNREFUSED' },
  { message: 'Socket closed abruptly during opening handshake' }
]

it.each(TRANSIENT_ERRORS)('should reconnect in 5 seconds if error is not permanent', async (error) => {
  amqplib.connect.mockImplementationOnce(async () => { throw error })

  await expect(connection.connect()).resolves.not.toThrow()

  expect(amqplib.connect).toHaveBeenCalledTimes(2)
})

it('should throw if error is permanent', async () => {
  const error = new Error()

  amqplib.connect.mockImplementationOnce(async () => { throw error })

  await expect(connection.connect()).rejects.toThrow(error)
})

describe.each([['Input', 'createChannel'], ['Output', 'createConfirmChannel']])('%s', (key, method) => {
  /** @type {jest.MockedObject<import('amqplib').Connection>} */
  let amqp

  /** @type {import('amqplib').Channel} */
  let chan

  /** @type {comq.Channel} */
  let channel

  beforeEach(async () => {
    await connection.connect()

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
  await connection.connect()
  await connection.close()

  const amqp = await amqplib.connect.mock.results[0].value

  expect(amqp.close).toHaveBeenCalled()
})

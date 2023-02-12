'use strict'

const { generate } = require('randomstring')

const mock = require('./connection.mock')

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
  expect(io.diagnose).toBeDefined()
})

it.each(['Output', 'Input'])('should re-emit events from %s',
  async (channelType) => {
    const event = generate()
    const listener = /** @type {Function} */ jest.fn(() => undefined)

    io.diagnose(event, listener)

    // lazy create io channels
    await io.reply(generate(), () => undefined)

    /** @type {jest.MockedObject<comq.Channel>} */
    const channel = await connection[`create${channelType}Channel`].mock.results[0].value

    expect(channel.diagnose).toHaveBeenCalledWith('*', expect.any(Function))

    const emit = channel.diagnose.mock.calls[0][1]

    emit(event)

    expect(listener).toHaveBeenCalled()
  })

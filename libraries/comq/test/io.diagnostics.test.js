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

it.each([
  ['flow', 'Output'],
  ['drain', 'Output'],
  ['flow', 'Input'],
  ['drain', 'Input']
])('should re-emit `%s` from %s channel',
  async (event, channelType) => {
    const listener = /** @type {Function} */ jest.fn(() => undefined)

    io.diagnose(/** @type {comq.diagnostics.event} */ event, listener)

    // lazy create io channels
    await io.reply(generate(), () => undefined)

    /** @type {jest.MockedObject<comq.Channel>} */
    const channel = await connection[`create${channelType}Channel`].mock.results[0].value

    expect(channel.diagnose).toHaveBeenCalledWith(event, expect.any(Function))

    const call = channel.diagnose.mock.calls.find((call) => call[0] === event)
    const emit = call[1]

    emit(event)

    expect(listener).toHaveBeenCalled()
  })

it.each(['open', 'close'])('should re-emit %s from connection',
  /**
   * @param {comq.diagnostics.event} event
   */
  async (event) => {
    const listener = /** @type {Function} */ jest.fn(() => undefined)

    expect(connection.diagnose).toHaveBeenCalledWith(event, expect.any(Function))

    const call = connection.diagnose.mock.calls.find((call) => call[0] === event)
    const emit = call[1]

    io.diagnose(event, listener)

    emit(event)

    expect(listener).toHaveBeenCalled()
  })

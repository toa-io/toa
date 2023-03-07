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

it.each(
  /** @type {comq.topology.type[]} */
  ['request', 'reply', 'event'])('should re-emit flow and drain events from %s channel',
  async (type) => {
    const flowListener = /** @type {Function} */ jest.fn(() => undefined)
    const drainListener = /** @type {Function} */ jest.fn(() => undefined)

    io.diagnose('flow', flowListener)
    io.diagnose('drain', drainListener)

    // create channels
    await io.reply(generate(), () => undefined)
    await io.emit(generate(), () => undefined)

    const channel = await findChannel(type)

    expect(channel.diagnose).toHaveBeenCalledWith('flow', expect.any(Function))
    expect(channel.diagnose).toHaveBeenCalledWith('drain', expect.any(Function))

    const flow = channel.diagnose.mock.calls.find((call) => call[0] === 'flow')[1]
    const drain = channel.diagnose.mock.calls.find((call) => call[0] === 'drain')[1]

    flow()
    drain()

    expect(flowListener).toHaveBeenCalledWith(type)
    expect(drainListener).toHaveBeenCalledWith(type)
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

    emit()

    expect(listener).toHaveBeenCalled()
  })

/**
 * @param {comq.topology.type} type
 * @returns {jest.MockedObject<comq.Channel>}
 */
const findChannel = (type) => {
  const index = connection.createChannel.mock.calls.findIndex(([t]) => (t === type))

  if (index === -1) throw new Error(`${type} channel hasn't been created`)

  return connection.createChannel.mock.results[index].value
}

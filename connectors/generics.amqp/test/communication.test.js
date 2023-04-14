'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const { promex } = require('@toa.io/generic')
const mock = require('./comq.mock')

jest.mock('comq', () => mock.comq)

const { Communication } = require('../source/communication')

it('should be', async () => {
  expect(Communication).toBeDefined()
})

const references = [generate(), generate()]

/** @type {toa.amqp.Communication} */
let comm

beforeEach(() => {
  jest.clearAllMocks()

  comm = new Communication(references)
})

it('should be instance of Connector', async () => {
  expect(comm).toBeInstanceOf(Connector)
})

it('should connect with given references', async () => {
  await comm.open()

  expect(mock.comq.connect).toHaveBeenCalledWith(...references)
})

it('should not throw if `close()` is called before connection is complete', async () => {
  const exception = new Error(generate())

  const connection = promex()
  let connected = false

  mock.comq.connect.mockImplementationOnce(() => connection)

  setImmediate(() => {
    expect(connected).toStrictEqual(false)

    connection.reject(exception)
  })

  await expect(comm.connect()).rejects.toThrow(exception)

  connected = true
})

describe('connected', () => {
  /** @type {jest.MockedObject<comq.IO>} */
  let io

  beforeEach(async () => {
    await comm.open()

    io = await mock.comq.connect.mock.results[0].value
  })

  it('should close', async () => {
    await comm.close()

    expect(io.seal).toHaveBeenCalled()
  })

  it('should dispose', async () => {
    await comm.dispose()

    expect(io.close).toHaveBeenCalled()
  })

  it('should bind reply', async () => {
    const queue = generate()
    const producer = jest.fn(async () => undefined)

    await comm.reply(queue, producer)

    expect(io.reply).toHaveBeenCalledWith(queue, producer)
  })

  it('should send request', async () => {
    const queue = generate()
    const request = generate()

    const reply = await comm.request(queue, request)

    expect(io.request).toHaveBeenCalledWith(queue, request)
    expect(reply).toStrictEqual(await io.request.mock.results[0].value)
  })

  it('should emit', async () => {
    const exchange = generate()
    const message = generate()
    const properties = { appId: 'test' }

    await comm.emit(exchange, message, properties)

    expect(io.emit).toHaveBeenCalledWith(exchange, message, properties)
  })

  it('should consume', async () => {
    const exchange = generate()
    const group = generate()
    const consumer = jest.fn(async () => undefined)

    await comm.consume(exchange, group, consumer)

    expect(io.consume).toHaveBeenCalledWith(exchange, group, consumer)
  })
})

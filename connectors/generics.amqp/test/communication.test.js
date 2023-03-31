'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const mock = require('./comq.mock')

jest.mock('comq', () => mock.comq)

const { Communication } = require('../source/communication')

it('should be', async () => {
  expect(Communication).toBeDefined()
})

/** @type {toa.pointer.Pointer} */
let pointer

/** @type {toa.amqp.Communication} */
let comm

beforeEach(() => {
  jest.clearAllMocks()

  pointer = /** @type {toa.pointer.Pointer} */ { reference: generate() }
  comm = new Communication(pointer)
})

it('should be instance of Connector', async () => {
  expect(comm).toBeInstanceOf(Connector)
})

it('should connect to a given pointer reference', async () => {
  await comm.open()

  expect(mock.comq.connect).toHaveBeenCalledWith(pointer.reference)
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

    await comm.emit(exchange, message)

    expect(io.emit).toHaveBeenCalledWith(exchange, message)
  })

  it('should consume', async () => {
    const exchange = generate()
    const group = generate()
    const consumer = jest.fn(async () => undefined)

    await comm.consume(exchange, group, consumer)

    expect(io.consume).toHaveBeenCalledWith(exchange, group, consumer)
  })
})

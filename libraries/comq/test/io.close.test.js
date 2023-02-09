'use strict'

const { generate } = require('randomstring')

const mock = require('./connection.mock')
const { IO } = require('../src/io')

/** @type {comq.IO} */
let io

/** @type {jest.MockedObject<comq.Connection>} */
let connection

/** @type {jest.MockedObject<comq.Channel>} */
let input

/** @type {jest.MockedObject<comq.Channel>} */
let output

beforeEach(async () => {
  jest.clearAllMocks()

  connection = mock.connection()
  io = new IO(connection)
})

describe('close', () => {
  it('should close both channels', async () => {
    await reply()
    await io.close()

    expect(input.close).toHaveBeenCalled()
    expect(output.close).toHaveBeenCalled()
  })

  it('should not throw if channels haven`t been initialized', async () => {
    await expect(io.close()).resolves.not.toThrow()
  })

  it('should close connection', async () => {
    await io.close()

    expect(connection.close).toHaveBeenCalled()
  })
})

describe('seal', () => {
  it('should be', async () => {
    expect(io.seal).toBeDefined()
  })

  it('should close input channel', async () => {
    await reply()
    await io.seal()

    expect(input.close).toHaveBeenCalled()
    expect(output.close).not.toHaveBeenCalled()
  })

  it('should not throw if channels haven`t been initialized', async () => {
    await expect(io.seal()).resolves.not.toThrow()
  })

  it('should not close input channel twice', async () => {
    await reply()
    await io.seal()
    await io.close()

    expect(input.close).toHaveBeenCalledTimes(1)
  })
})

const reply = async () => {
  // initialize both channels
  await io.reply(generate(), () => undefined)

  input = await connection.in.mock.results[0].value
  output = await connection.out.mock.results[0].value
}

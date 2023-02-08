'use strict'

const { generate } = require('randomstring')

const mock = require('./connection.mock')
const { IO } = require('../src/io')

/** @type {toa.comq.IO} */
let io

/** @type {jest.MockedObject<toa.comq.Connection>} */
let connection

/** @type {jest.MockedObject<toa.comq.Channel>} */
let input

/** @type {jest.MockedObject<toa.comq.Channel>} */
let output

beforeEach(async () => {
  jest.clearAllMocks()

  connection = mock.connection()
  io = new IO(connection)
})

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

const reply = async () => {
  // initialize both channels
  await io.reply(generate(), () => undefined)

  input = await connection.in.mock.results[0].value
  output = await connection.out.mock.results[0].value
}

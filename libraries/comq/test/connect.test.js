'use strict'

const { generate } = require('randomstring')

const { connect } = require('../')

jest.mock('../src/io')
jest.mock('../src/connection')

const { IO } = require('../src/io')

const {
  /** @type {jest.MockedClass<comq.Connection>} */
  Connection
} = require('../src/connection')

it('should be', async () => {
  expect(connect).toBeDefined()
})

const url = generate()

/** @type {comq.IO} */
let io

beforeEach(async () => {
  jest.clearAllMocks()

  io = await connect(url)
})

it('should return IO', async () => {
  expect(io).toBeInstanceOf(IO)
})

it('should pass active connection', async () => {
  expect(Connection).toHaveBeenCalledWith(url)

  /** @type {jest.MockedObject<comq.Connection>} */
  const instance = Connection.mock.instances[0]

  expect(instance.connect).toHaveBeenCalled()
  expect(IO).toHaveBeenCalledWith(instance)
})

'use strict'

const { generate } = require('randomstring')

const fixtures = require('./batcher.fixtures')
const { Batcher } = require('../src/batcher')

let connection

let batcher

beforeEach(async () => {
  jest.clearAllMocks()

  connection = /** @type {toa.mongodb.Connection} */ fixtures.connection

  batcher = new Batcher(connection)

  await batcher.connect()
})

it('should be', () => {
  expect(Batcher).toBeDefined()
})

it('should depend on connection', () => {
  expect(connection.link).toHaveBeenCalledWith(batcher)
})

it('should insert', async () => {
  const object = generate()

  await batcher.add(object)

  expect(connection.add).toHaveBeenCalledWith([object])
})

it('should batch insert', async () => {
  const a = generate()
  const b = generate()
  const c = generate()

  connection.add.mockImplementationOnce(() => new Promise(
    (resolve) => setImmediate(() => resolve(true))
  ))

  await Promise.all([
    batcher.add(a),
    batcher.add(b),
    batcher.add(c)
  ])

  expect(connection.add).toHaveBeenCalledTimes(2)
  expect(connection.add).toHaveBeenNthCalledWith(1, [a])
  expect(connection.add).toHaveBeenNthCalledWith(2, [b, c])
})

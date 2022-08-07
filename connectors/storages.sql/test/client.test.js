'use strict'

const { generate } = require('randomstring')

const fixtures = require('./client.fixtures')
const { Client } = require('../src/client')

/** @type {toa.sql.Pointer} */
let pointer

/** @type {toa.sql.Connection} */
let connection

/** @type {toa.sql.Client} */
let client

beforeEach(() => {
  jest.clearAllMocks()

  connection = /** @type {toa.sql.Connection} */ fixtures.connection
  pointer = /** @type {toa.sql.Pointer} */ fixtures.pointer

  client = new Client(connection, pointer)
})

it('should be', () => {
  expect(Client).toBeDefined()
})

it('should depend on connection', () => {
  expect(connection.link).toHaveBeenCalledWith(client)
})

it('should insert', async () => {
  const object = generate()

  await client.insert(object)

  expect(connection.insert).toHaveBeenCalledWith(pointer.table, [object])
})

it('should batch insert', async () => {
  const a = generate()
  const b = generate()
  const c = generate()

  connection.insert.mockImplementationOnce(() => new Promise(
    (resolve) => setImmediate(() => resolve(true))
  ))

  await Promise.all([
    client.insert(a),
    client.insert(b),
    client.insert(c)
  ])

  expect(connection.insert).toHaveBeenCalledTimes(2)
  expect(connection.insert).toHaveBeenNthCalledWith(1, pointer.table, [a])
  expect(connection.insert).toHaveBeenNthCalledWith(2, pointer.table, [b, c])
})

it('should update', async () => {
  const criteria = generate()
  const object = generate()

  await client.update(criteria, object)

  expect(connection.update).toHaveBeenCalledWith(pointer.table, criteria, object)
})

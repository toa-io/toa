'use strict'

const { generate } = require('randomstring')

const fixtures = require('./client.fixtures')
const { Client } = require('../src/client')

let connection

let client

beforeEach(async () => {
  jest.clearAllMocks()

  connection = /** @type {toa.sql.Connection} */ fixtures.connection

  client = new Client(connection)

  await client.connect()
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

  expect(connection.insert).toHaveBeenCalledWith(connection.table, [object])
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
  expect(connection.insert).toHaveBeenNthCalledWith(1, connection.table, [a])
  expect(connection.insert).toHaveBeenNthCalledWith(2, connection.table, [b, c])
})

it('should update', async () => {
  const criteria = generate()
  const object = generate()

  await client.update(criteria, object)

  expect(connection.update).toHaveBeenCalledWith(connection.table, criteria, object)
})

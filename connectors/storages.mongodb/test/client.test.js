'use strict'

const fixtures = require('./client.fixtures')
const mock = fixtures.mock

jest.mock('mongodb', () => ({ MongoClient: mock.MongoClient }))

const { Client } = require('../src/client')

let instance, client

beforeEach(async () => {
  jest.clearAllMocks()

  instance = new Client(fixtures.locator.host, fixtures.locator.db, fixtures.locator.collection)
  await instance.connect()

  client = fixtures.mock.MongoClient.mock.instances[0]
})

it('should create client', () => {
  expect(client).toBeDefined()
  expect(fixtures.mock.MongoClient).toHaveBeenCalledWith(
    `mongodb+srv://${fixtures.locator.host}`,
    fixtures.OPTIONS
  )
})

it('should use env url', async () => {
  process.env.KOO_DEV_MONGODB_URL = 'some://url'

  instance = new Client(fixtures.locator.host, fixtures.locator.db, fixtures.locator.collection)
  await instance.connect()

  expect(fixtures.mock.MongoClient).toHaveBeenCalledWith(
    process.env.KOO_DEV_MONGODB_URL,
    fixtures.OPTIONS
  )

  delete process.env.KOO_DEV_MONGODB_URL
})

it('should connect', async () => {
  expect(client.connect).toHaveBeenCalled()
  expect(client.db).toHaveBeenCalledWith(fixtures.locator.db)

  const db = client.db.mock.results[0].value

  expect(db.collection).toHaveBeenCalledWith(fixtures.locator.collection)
})

it('should disconnect', async () => {
  await instance.disconnect()

  expect(client.connect).toHaveBeenCalled()
  expect(client.close).toHaveBeenCalled()
})

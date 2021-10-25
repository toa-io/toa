'use strict'

const fixtures = require('./client.fixtures')
const mock = fixtures.mock

jest.mock('mongodb', () => ({ MongoClient: mock.MongoClient }))

const { Client } = require('../src/client')

let instance, client, collection

beforeEach(async () => {
  jest.clearAllMocks()

  const env = process.env.TOA_ENV

  delete process.env.TOA_ENV

  instance = new Client(fixtures.locator.host, fixtures.locator.db, fixtures.locator.collection)
  await instance.connect()

  process.env.TOA_ENV = env

  client = fixtures.mock.MongoClient.mock.instances[0]

  collection = fixtures.mock.MongoClient.mock.instances[0]
    .db.mock.results[0].value
    .collection.mock.results[0].value
})

it('should create client', () => {
  expect(client).toBeDefined()
  expect(fixtures.mock.MongoClient).toHaveBeenCalledWith(
    `mongodb+srv://${fixtures.locator.host}`,
    fixtures.OPTIONS
  )
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

it('should add', async () => {
  const ok = await instance.add(fixtures.object)

  expect(collection.insertOne).toHaveBeenCalledWith(fixtures.object)
  expect(ok).toBe(collection.insertOne.mock.results[0].value.acknowledged)
})

it('should get', async () => {
  const entity = await instance.get(fixtures.query.criteria, fixtures.query.options)

  expect(entity).toBe(collection.findOne.mock.results[0].value)
  expect(collection.findOne).toHaveBeenCalledWith(fixtures.query.criteria, fixtures.query.options)
})

it('should replace', async () => {
  const update = { ...fixtures.object, foo: 'foo' }
  await instance.replace(fixtures.query.criteria, update, fixtures.query.options)

  expect(collection.findOneAndReplace).toHaveBeenCalledWith(fixtures.query.criteria, update, fixtures.query.options)
})

it('should find', async () => {
  const set = await instance.find(fixtures.query.criteria, fixtures.query.options)

  expect(set).toStrictEqual(collection.find.mock.results[0].value.toArray.mock.results[0].value)
  expect(collection.find).toHaveBeenCalledWith(fixtures.query.criteria, fixtures.query.options)
})

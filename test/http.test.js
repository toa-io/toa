'use strict'

const randomstring = require('randomstring')

const { Context } = require('./framework')
const { Query } = require('../packages/runtime/src/query')

let context, collection, request, parser

beforeAll(async () => {
  context = new Context({
    composition: ['messages'],
    storage: 'mongodb'
  })

  await context.setup()

  collection = context.storage.collection('messages', 'messages')
  request = context.request()

  parser = new Query({ text: { type: 'string' }, timestamp: { type: 'number' } })
})

afterAll(async () => {
  await context.teardown()
})

afterEach(async () => {
  await collection.deleteMany()
})

it('should be ready', async () => {
  const response = await request.get('/')

  expect(response.status).toBe(200)
})

it('should add message', async () => {
  const message = { text: randomstring.generate() }
  const response = await request.post('/messages.messages/add').send({ input: message })

  expect(response.status).toBe(200)
  expect(response.body.output.id).toBeDefined()

  const created = await collection.findOne({ _id: response.body.output.id })

  expect(created).toMatchObject(message)
})

it('should find messages', async () => {
  const messages = Array.from(Array(5))
    .map((_, index) => ({ _id: `id${index}`, text: randomstring.generate(), timestamp: index }))

  const { acknowledged } = await collection.insertMany(messages)

  expect(acknowledged).toBeTruthy()

  const [query] = parser.parse({ criteria: 'timestamp<2', sort: 'timestamp:desc' })
  const expected = [messages[1], messages[0]]
    .map(({ _id, ...rest }) => ({ id: _id, ...rest }))

  const response = await request.post('/messages.messages/find', { query })

  expect(response.body.output.messages).toStrictEqual(expected)
})

it('should respond 500 on exception', async () => {
  const message = { text: 'throw exception' }
  const response = await request.post('/messages.messages/add').send({ input: message })

  expect(response.status).toBe(500)
})

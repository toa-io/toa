'use strict'

const randomstring = require('randomstring')

const { Context } = require('./framework')

let context, collection, request

beforeAll(async () => {
  context = new Context({
    composition: ['messages'],
    storage: 'mongodb'
  })

  await context.setup()

  collection = context.storage.collection('messages', 'messages')
  request = context.request()
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
  const response = await request.post('/messages.messages/add').send(message)

  expect(response.status).toBe(200)
  expect(response.body.output.id).toBeDefined()

  const created = await collection.findOne({ _id: response.body.output.id })

  expect(created).toMatchObject(message)
})

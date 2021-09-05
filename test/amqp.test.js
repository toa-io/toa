'use strict'

const randomstring = require('randomstring')

const { Context } = require('./framework')

const amqp = require('../connectors/bindings.amqp/src/factory')
const { Locator } = require('../packages/runtime/src/locator')

let context, collection, consumer

beforeAll(async () => {
  context = new Context({
    composition: ['messages'],
    storage: 'mongodb',
    bindings: ['amqp']
  })

  await context.setup()

  collection = context.storage.collection('messages', 'messages')
  consumer = (new amqp.Factory()).consumer(new Locator('messages', 'messages'))

  await consumer.connect()
})

it('should add message', async () => {
  jest.setTimeout(30000)

  const message = { text: randomstring.generate() }
  const [output] = await consumer.request({ name: 'add' }, message)

  expect(output.id).toBeDefined()

  const created = await collection.findOne({ _id: output.id })

  expect(created).toMatchObject(message)
})

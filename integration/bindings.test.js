'use strict'

const randomstring = require('randomstring')

const framework = require('./framework')

const BINDINGS = ['http', 'amqp']

let composition, collection, consumer

beforeAll(async () => {
  composition = await framework.compose({ dummies: ['messages', 'credits'], bindings: BINDINGS })
  collection = await framework.mongodb.connect('messages', 'messages')
})

afterAll(async () => {
  await composition.disconnect()
  await collection.disconnect()
})

BINDINGS.forEach((binding) => {
  describe(binding, () => {
    beforeAll(async () => {
      consumer = await framework.consume(binding, 'messages', 'messages')
    })

    afterAll(async () => {
      await consumer.disconnect()
    })

    it('should add message', async () => {
      const message = { text: randomstring.generate() }
      const [output] = await consumer.request('add', message)

      expect(output.id).toBeDefined()

      const created = await collection.get({ _id: output.id })

      expect(created).toMatchObject(message)
    })

    // it('should find messages', async () => {
    //   const messages = Array.from(Array(5))
    //     .map((_, index) => ({ _id: `id${index}`, text: randomstring.generate(), timestamp: index }))
    //
    //   const { acknowledged } = await collection.insertMany(messages)
    //
    //   expect(acknowledged).toBeTruthy()
    //
    //   const [query] = parser.parse({ criteria: 'timestamp<2', sort: 'timestamp:desc' })
    //   const expected = [messages[1], messages[0]]
    //     .map(({ _id, ...rest }) => ({ id: _id, ...rest }))
    //
    //   const response = await request.post('/messages.messages/find', { query })
    //
    //   expect(response.body.output.messages).toStrictEqual(expected)
    // })
    //
    // it('should respond 500 on exception', async () => {
    //   const message = { text: 'throw exception' }
    //   const response = await request.post('/messages.messages/add').send({ input: message })
    //
    //   expect(response.status).toBe(500)
    // })
  })
})

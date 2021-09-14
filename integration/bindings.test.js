'use strict'

const { generate } = require('randomstring')

const framework = require('./framework')

const BINDINGS = ['http', 'amqp'].map((binding) => '@kookaburra/bindings.' + binding)

let composition, collection

beforeAll(async () => {
  composition = await framework.compose({ dummies: ['messages', 'credits'], bindings: BINDINGS })
  collection = await framework.mongodb.connect('messages.messages')
})

afterAll(async () => {
  await composition.disconnect()
  await collection.disconnect()
})

beforeEach(async () => {
  collection.clear()
})

BINDINGS.forEach((binding) => {
  describe(binding, () => {
    let consumer, remote

    beforeAll(async () => {
      consumer = await framework.consume(binding, 'messages.messages')
      remote = await framework.remote('messages.messages', binding)
    })

    afterAll(async () => {
      await consumer.disconnect()
      await remote.disconnect()
    })

    describe('consumer', () => {
      it('should add message', async () => {
        const message = { sender: generate(), text: generate() }
        const [output] = await consumer.request('add', message)

        expect(output.id).toBeDefined()

        const created = await collection.get({ _id: output.id })

        expect(created).toMatchObject(message)
      })

      it('should throw exception / TBD', async () => {
        const message = { sender: generate(), text: 'throw exception' }
        await expect(consumer.request('add', message)).rejects.toThrow()
      })
    })

    describe('remote', () => {
      it('should get message', async () => {
        const message = { sender: generate(), text: generate() }
        const [created] = await remote.invoke('add', message)

        expect(created.id).toBeDefined()

        const [output] = await remote.invoke('get', null, { criteria: `id==${created.id}` })

        expect(output).toBeDefined()
        expect(output.id).toBe(created.id)
      })

      it('should find messages', async () => {
        const sender = generate()
        const messages = Array.from(Array(5)).map((_, index) =>
          ({ sender, text: generate(), timestamp: index }))

        await Promise.all(messages.map((message) => remote.invoke('add', message)))

        const [output] = await remote.invoke('find', null, {
          criteria: `sender==${sender}`,
          sort: 'timestamp:desc',
          projection: 'sender,text'
        })

        const projection = messages
          .sort((a, b) => b.timestamp - a.timestamp)
          .map(({ sender, text }) => ({ id: expect.any(String), sender, text }))

        expect(output.messages).toBeDefined()
        expect(projection).toStrictEqual(output.messages)
      })
    })
  })
})

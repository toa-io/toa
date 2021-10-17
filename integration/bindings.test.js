'use strict'

const { generate } = require('randomstring')
const { newid } = require('@toa.io/gears')

const framework = require('./framework')

const BINDINGS = ['http', 'amqp'].map((binding) => '@toa.io/bindings.' + binding)

global.KOO_BINDINGS_LOOP_DISABLED = 1

let collection

beforeAll(async () => {
  collection = await framework.mongodb.connect('messages.messages')
})

afterAll(async () => {
  await collection.disconnect()
})

BINDINGS.forEach((binding) => {
  describe(binding, () => {
    let remote, composition

    beforeAll(async () => {
      composition = await framework.compose(['messages', 'credits'], { bindings: [binding] })
      remote = await framework.remote('messages.messages', binding)
    })

    afterAll(async () => {
      await composition.disconnect()
      await remote.disconnect()
    })

    it('should get message', async () => {
      const message = { sender: newid(), text: generate() }
      const created = await remote.invoke('add', { input: message })

      expect(created.output.id).toBeDefined()

      const reply = await remote.invoke('get', { query: { criteria: `id==${created.output.id}` } })

      expect(reply.output).toBeDefined()
      expect(reply.output.id).toBe(created.output.id)
    })

    it('should find messages', async () => {
      const sender = newid()

      const messages = Array.from(Array(5)).map((_, index) =>
        ({ sender, text: generate(), timestamp: index }))

      for (const message of messages) {
        await remote.invoke('add', { input: message })
      }

      const reply = await remote.invoke('find', {
        query: {
          criteria: `sender==${sender}`,
          sort: 'timestamp:desc',
          projection: 'sender,text'
        }
      })

      const projection = messages
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(({ sender, text }) => ({ id: expect.any(String), sender, text }))

      expect(reply.output).toBeDefined()
      expect(reply.output).toMatchObject(projection)
    })

    it('should throw on invalid input', async () => {
      await expect(remote.invoke('add')).rejects.toMatchObject({ code: 0 })
      await expect(remote.invoke('add', {})).rejects.toMatchObject({ code: 201, keyword: 'required' })
    })
  })
})

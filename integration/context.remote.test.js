'use strict'

const { generate } = require('randomstring')
const { random, newid, encode } = require('@toa.io/libraries/generic')

const framework = require('./framework')

let composition
let messages
let credits

beforeAll(async () => {
  framework.env('local')

  composition = await framework.compose(['../context/messages', 'credits'])
  messages = await framework.remote('messages.messages')
  credits = await framework.remote('credits.balance')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (messages) await messages.disconnect()
  if (credits) await credits.disconnect()

  framework.env()
})

it('should deduce credits', async () => {
  const times = 5 + random(5)
  const sender = newid()
  const text = generate()

  for (let i = 0; i < times; i++) {
    await messages.invoke('add', { input: { sender, text } })
  }

  const balance = await credits.invoke('observe', { query: { id: sender } })

  expect(balance.output.balance).toStrictEqual(10 - times)
})

// configuration
it('should deduce more credits', async () => {
  process.env.TOA_CONFIGURATION_MESSAGES_MESSAGES = encode({ price: 2 })

  await composition.reconnect()

  const sender = newid()
  const text = generate()

  await messages.invoke('add', { input: { sender, text } })

  const balance = await credits.invoke('observe', { query: { id: sender } })

  expect(balance.output.balance).toStrictEqual(10 - 2)

  delete process.env.TOA_CONFIGURATION_MESSAGES_MESSAGES
})

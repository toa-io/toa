'use strict'

const { generate } = require('randomstring')
const { random, newid } = require('@toa.io/generic')

const framework = require('./framework')

let composition
let messages
let credits

beforeAll(async () => {
  framework.dev(true)

  composition = await framework.compose(['../context/messages', 'credits'])
  messages = await framework.remote('messages.messages')
  credits = await framework.remote('credits.balance')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (messages) await messages.disconnect()
  if (credits) await credits.disconnect()

  framework.dev(false)
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

'use strict'

const { generate } = require('randomstring')
const { timeout, random, newid } = require('@toa.io/gears')

const framework = require('./framework')

let composition, messages, stats, a

beforeAll(async () => {
  composition = await framework.compose(['messages', 'credits', 'stats', 'a'])
  messages = await framework.remote('messages.messages')
  stats = await framework.remote('stats.stats')
  a = await framework.remote('dummies.a')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (messages) await messages.disconnect()
  if (stats) await stats.disconnect()
  if (a) await a.disconnect()
})

it('should receive', async () => {
  const times = 5 + random(5)
  const sender = newid()
  const text = generate()

  for (let i = 0; i < times; i++) {
    await messages.invoke('add', { input: { sender, text, free: true } })
  }

  await timeout(50) // process events

  const counted = await stats.invoke('observe', { query: { id: sender } })
  const updated = await a.invoke('observe', { query: { id: sender } })

  expect(counted.output.messages).toBe(times)
  expect(updated.output.title).toBe(text)
})

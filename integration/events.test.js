'use strict'

const { generate } = require('randomstring')
const { timeout, random, newid } = require('@toa.io/gears')

const framework = require('./framework')

let composition, messages, stats

beforeAll(async () => {
  composition = await framework.compose(['messages', 'credits', 'stats'])
  messages = await framework.remote('messages.messages')
  stats = await framework.remote('stats.stats')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (messages) await messages.disconnect()
  if (stats) await stats.disconnect()
})

it('should count messages', async () => {
  const times = 5 + random(5)
  const sender = newid()

  for (let i = 0; i < times; i++) {
    await messages.invoke('add', { input: { sender, text: generate(), free: true } })
    await timeout(100) // avoid concurrency
  }

  const updated = await stats.invoke('observe', { query: { id: sender } })

  expect(updated.output.messages).toBe(times)
})

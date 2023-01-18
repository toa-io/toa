'use strict'

const { generate } = require('randomstring')
const { timeout, random, repeat, newid } = require('@toa.io/libraries/generic')

const framework = require('./framework')

let composition, messages, credits, stats

beforeAll(async () => {
  framework.env('local')

  composition = await framework.compose(['messages', 'credits', 'stats'])
  messages = await framework.remote('messages.messages')
  credits = await framework.remote('credits.balance')
  stats = await framework.remote('stats.stats')
})

afterAll(async () => {
  if (messages) await messages.disconnect()
  if (credits) await credits.disconnect()
  if (stats) await stats.disconnect()
  if (composition) await composition.disconnect()

  framework.env()
})

it('should not throw on concurrency conflict', async () => {
  const id = newid()
  const times = 10 + random(10)

  await credits.invoke('transit', { input: { balance: 30 }, query: { id } }) // init

  await expect(repeat(() => credits.invoke('debit', { input: 1, query: { id } }), times))
    .resolves.not.toThrow()

  const { output } = await credits.invoke('observe', { query: { id } })

  expect(output.balance).toBe(30 - times)
})

it('should count messages', async () => {
  const times = 5 + random(5)
  const sender = newid()

  await repeat(() => messages.invoke('add', {
    input: {
      sender,
      text: generate(),
      free: true
    }
  }), times)

  await timeout(200) // event processing with retries

  const updated = await stats.invoke('observe', { query: { id: sender } })

  expect(updated.output.messages).toBe(times)
})

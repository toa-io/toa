'use strict'

const { generate } = require('randomstring')
const { timeout, random, repeat } = require('@kookaburra/gears')
const { id } = require('../runtime/core/src/id')

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
  const sender = id()

  await repeat(() => messages.invoke('add', { input: { sender, text: generate(), free: true } }), times)

  await timeout(50) // event processing

  const updated = await stats.invoke('observe', { query: { id: sender } })

  expect(updated.output.messages).toBe(times)
})

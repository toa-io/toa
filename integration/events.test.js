'use strict'

const { generate } = require('randomstring')
const {
  timeout,
  random,
  newid
} = require('@toa.io/generic')

const framework = require('./framework')

let composition, messages, credits, stats, a

beforeAll(async () => {
  framework.dev(true)

  composition = await framework.compose(['messages', 'credits', 'stats', 'a'])
  messages = await framework.remote('default.messages')
  credits = await framework.remote('credits.balance')
  stats = await framework.remote('stats.stats')
  a = await framework.remote('dummies.a')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (messages) await messages.disconnect()
  if (credits) await credits.disconnect()
  if (stats) await stats.disconnect()
  if (a) await a.disconnect()

  framework.dev(false)
})

it('should receive', async () => {
  const times = 5 + random(5)
  const sender = newid()
  const text = generate()

  for (let i = 0; i < times; i++) {
    await messages.invoke('add', {
      input: {
        sender,
        text,
        free: true
      }
    })
  }

  await timeout(200) // events processing

  const counted = await stats.invoke('observe', { query: { id: sender } })
  const updated = await a.invoke('observe', { query: { id: sender } })

  expect(counted.messages).toBe(times)
  expect(updated.title).toBe(text)
})

it('should receive conditionally', async () => {
  const sender = newid()

  // 10 initial credits
  for (let i = 0; i < 9; i++) {
    await messages.invoke('add', {
      input: {
        sender,
        text: generate()
      }
    })
  }

  await timeout(200)

  const before = await stats.invoke('observe', { query: { id: sender } })

  expect(before).toEqual(expect.objectContaining({
    id: sender,
    messages: 9,
    _version: 9
  }))

  await messages.invoke('add', {
    input: {
      sender,
      text: generate()
    }
  })

  await timeout(100)

  const balance = await credits.invoke('observe', { query: { id: sender } })
  const after = await stats.invoke('observe', { query: { id: sender } })

  expect(balance.balance).toBe(0)

  expect(after).toEqual(expect.objectContaining({
    id: sender,
    messages: 10,
    bankrupt: true,
    _version: 11
  }))
})

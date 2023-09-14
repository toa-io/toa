'use strict'

const { generate } = require('randomstring')
const { exceptions: { codes } } = require('@toa.io/core')
const { newid, timeout } = require('@toa.io/generic')

// noinspection DuplicatedCode
const framework = require('./framework')

let composition, credits, messages, stats

beforeAll(async () => {
  framework.dev(true)

  composition = await framework.compose(['messages', 'credits', 'stats'])

  messages = await framework.remote('default.messages')
  credits = await framework.remote('credits.balance')
  stats = await framework.remote('stats.stats')
})

afterAll(async () => {
  if (messages) await messages.disconnect()
  if (credits) await credits.disconnect()
  if (stats) await stats.disconnect()

  if (composition) await composition.disconnect()

  framework.dev(false)
})

it('should assign', async () => {
  const sender = newid()
  const text = generate()
  const created = await messages.invoke('add', { input: { sender, text } })
  const query = { id: created.id }

  expect(created.id).toBeDefined()

  const reply = await messages.invoke('assign', { input: { text: generate() }, query })

  await timeout(200)

  expect(reply).toBeUndefined()

  const updated = await messages.invoke('observe', { query })

  expect(updated).toStrictEqual({
    id: query.id,
    _version: 2,
    sender,
    text: expect.not.stringMatching(text)
  })
})

it('should emit events', async () => {
  const sender = newid()
  const text = generate()
  const created = await messages.invoke('add', { input: { sender, text } })

  expect(created.id).toBeDefined()

  const before = await credits.invoke('observe', { query: { id: sender } })

  expect(before).toStrictEqual({
    id: sender,
    _version: 1,
    balance: 9
  })

  await credits.invoke('set', { input: { balance: 0 }, query: { id: sender } })
  await timeout(200)

  const stat = await stats.invoke('observe', { query: { id: sender } })

  expect(stat.bankrupt).toBe(true)
})

it('should throw StateNotFound', async () => {
  const id = newid()

  await expect(messages.invoke('assign', { input: { text: generate() }, query: { id } }))
    .rejects.toMatchObject({ code: codes.StateNotFound })
})

it('should throw StatePrecondition', async () => {
  const id = newid()

  await expect(messages.invoke('assign', {
    input: { text: generate() },
    query: { id, version: 1 }
  }))
    .rejects.toMatchObject({ code: codes.StatePrecondition })
})

it('should assign initialized', async () => {
  const id = newid()
  await credits.invoke('set', { input: { balance: 30 }, query: { id } })

  const reply = await credits.invoke('observe', { query: { id } })

  expect(reply).toStrictEqual({
    id,
    _version: 1,
    balance: 30
  })
})

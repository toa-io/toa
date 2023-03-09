'use strict'

const { generate } = require('randomstring')
const { exceptions: { codes } } = require('@toa.io/core')
const { newid, timeout } = require('@toa.io/generic')

// noinspection DuplicatedCode
const framework = require('./framework')

let composition, credits, messages, stats

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

it('should assign', async () => {
  const sender = newid()
  const text = generate()
  const created = await messages.invoke('add', { input: { sender, text } })
  const query = { id: created.output.id }

  expect(created.output.id).toBeDefined()

  const reply = await messages.invoke('assign', { input: { text: generate() }, query })

  await timeout(200)

  expect(reply).toStrictEqual({})

  const updated = await messages.invoke('observe', { query })

  expect(updated.output).toStrictEqual({
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

  expect(created.output.id).toBeDefined()

  const before = await credits.invoke('observe', { query: { id: sender } })

  expect(before.output).toStrictEqual({
    id: sender,
    _version: 1,
    balance: 9
  })

  await credits.invoke('set', { input: { balance: 0 }, query: { id: sender } })
  await timeout(200)

  const stat = await stats.invoke('observe', { query: { id: sender } })

  expect(stat.output.bankrupt).toBe(true)
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

  expect(reply.output).toStrictEqual({
    id,
    _version: 1,
    balance: 30
  })
})

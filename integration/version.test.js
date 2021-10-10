'use strict'

const { id } = require('../runtime/core/src/id')

const framework = require('./framework')

let composition, remote

beforeAll(async () => {
  composition = await framework.compose(['credits'])
  remote = await framework.remote('credits.balance')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (remote) await remote.disconnect()
})

it('should return', async () => {
  const user = id()

  const { output } = await remote.invoke('observe', { query: { id: user } })

  expect(output._version).toBe(0)
})

it('should return with projection', async () => {
  const user = id()

  const { output } = await remote.invoke('observe', { query: { id: user, projection: 'balance' } })

  expect(output._version).toBe(0)
})

it('should increment', async () => {
  const user = id()

  await remote.invoke('transit', { input: { balance: 50 }, query: { id: user } })
  await remote.invoke('transit', { input: { balance: 30 }, query: { id: user } })
  const { output } = await remote.invoke('observe', { query: { id: user } })

  expect(output._version).toBe(2)
})

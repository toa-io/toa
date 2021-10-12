'use strict'

const { id: newid } = require('../runtime/core/src/id')

const framework = require('./framework')
const { random, repeat } = require('@kookaburra/gears')

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
  const id = newid()

  const { output } = await remote.invoke('observe', { query: { id } })

  expect(output._version).toBe(0)
})

it('should return with projection', async () => {
  const id = newid()

  const { output } = await remote.invoke('observe', { query: { id, projection: 'balance' } })

  expect(output._version).toBe(0)
})

it('should increment', async () => {
  const id = newid()

  await remote.invoke('transit', { input: { balance: 50 }, query: { id } })
  await remote.invoke('transit', { input: { balance: 30 }, query: { id } })
  const { output } = await remote.invoke('observe', { query: { id } })

  expect(output._version).toBe(2)
})

it('should throw on update conflict', async () => {
  const id = newid()
  const times = 10 + random(10)

  await remote.invoke('transit', { input: { balance: 30 }, query: { id } })

  await expect(repeat(() => remote.invoke('deduce', { input: 1, query: { id } }), times))
    .rejects.toMatchObject({ code: 33 })
})

it('should throw on version conflict', async () => {
  const id = newid()
  await remote.invoke('transit', { input: { balance: 1 }, query: { id } }) // init

  const { output } = await remote.invoke('observe', { query: { id } })
  expect(output._version).toBe(1)

  await remote.invoke('transit', { input: { balance: 2 }, query: { id } })

  await expect(remote.invoke('transit', { input: { balance: 2 }, query: { id, version: output._version } }))
    .rejects.toMatchObject({ code: 32 })
})

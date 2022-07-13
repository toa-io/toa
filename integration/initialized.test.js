'use strict'

const { newid } = require('@toa.io/libraries/generic')

const framework = require('./framework')
const { codes } = require('@toa.io/core/src/exceptions')

let composition, remote, messages

beforeAll(async () => {
  framework.env('local')

  composition = await framework.compose(['credits'])
  remote = await framework.remote('credits.balance')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (messages) await messages.disconnect()
  if (remote) await remote.disconnect()

  framework.env()
})

it('should provide default', async () => {
  const request = { query: { id: newid() } }
  const reply = await remote.invoke('observe', request)

  expect(reply.output?.balance).toBe(10)
})

it('should transit', async () => {
  const request = { input: 1, query: { id: newid() } }
  const reply = await remote.invoke('deduce', request)

  expect(reply.output).toBe(9)

  const { output } = await remote.invoke('observe', { query: request.query })
  expect(output.balance).toBe(9)
})

it('should throw on query: false', async () => {
  await expect(remote.invoke('add', { input: { balance: 20 } }))
    .rejects.toMatchObject({ code: codes.StateInitialization })
})

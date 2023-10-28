'use strict'

const { newid } = require('@toa.io/generic')

const framework = require('./framework')
const { codes } = require('@toa.io/core/src/exceptions')

let composition, remote, messages

beforeAll(async () => {
  framework.dev(true)

  composition = await framework.compose(['credits'])
  remote = await framework.remote('credits.balance')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (messages) await messages.disconnect()
  if (remote) await remote.disconnect()

  framework.dev(false)
})

it('should provide default', async () => {
  const request = { query: { id: newid() } }
  const reply = await remote.invoke('observe', request)

  expect(reply.balance).toBe(10)
})

it('should transit', async () => {
  const request = { input: 1, query: { id: newid() } }
  const reply = await remote.invoke('deduce', request)

  expect(reply).toBe(9)

  const output = await remote.invoke('observe', { query: request.query })
  expect(output.balance).toBe(9)
})

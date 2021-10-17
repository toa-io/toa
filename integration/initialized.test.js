'use strict'

const { newid } = require('@toa.io/gears')

const framework = require('./framework')

let composition, remote, messages

beforeAll(async () => {
  composition = await framework.compose(['credits'])
  remote = await framework.remote('credits.balance')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (messages) await messages.disconnect()
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

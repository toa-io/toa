'use strict'

const { newid } = require('@toa.io/generic')

const framework = require('./framework')

let composition, remote

beforeAll(async () => {
  framework.env('local')

  composition = await framework.compose(['messages', 'credits'])
  remote = await framework.remote('messages.messages')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (remote) await remote.disconnect()

  framework.env()
})

it('should forward', async () => {
  const reply = await remote.invoke('update', { input: { sender: newid(), text: '2' } })
  expect(reply).toMatchObject({ output: { id: expect.any(String), ok: 'ok' } })
})

it('should forward recursive', async () => {
  const reply = await remote.invoke('change', { input: { sender: newid(), text: '2' } })
  expect(reply).toMatchObject({ output: { id: expect.any(String), ok: 'ok' } })
})

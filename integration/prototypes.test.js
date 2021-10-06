'use strict'

const { id } = require('../runtime/core/src/id')

const framework = require('./framework')

let composition, remote

beforeAll(async () => {
  composition = await framework.compose(['messages', 'credits'])
  remote = await framework.remote('messages.messages')
})

afterAll(async () => {
  await composition.disconnect()
})

it('should merge reply', async () => {
  const reply = await remote.invoke('transit', { input: { sender: id(), text: '2' } })
  expect(reply).toMatchObject({ output: { id: expect.any(String), ok: 'ok' } })
})

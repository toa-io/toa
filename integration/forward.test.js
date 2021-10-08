const { id } = require('../runtime/core/src/id')

const framework = require('./framework')

let composition, remote

beforeAll(async () => {
  composition = await framework.compose(['messages', 'credits'])
  remote = await framework.remote('messages.messages')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
})

it('should forward', async () => {
  const reply = await remote.invoke('update', { input: { sender: id(), text: '2' } })
  expect(reply).toMatchObject({ output: { id: expect.any(String), ok: 'ok' } })
})

it('should forward recursive', async () => {
  const reply = await remote.invoke('change', { input: { sender: id(), text: '2' } })
  expect(reply).toMatchObject({ output: { id: expect.any(String), ok: 'ok' } })
})

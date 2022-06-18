'use strict'

const framework = require('./framework')

let composition
let remote

beforeAll(async () => {
  composition = await framework.compose(['origins'])
  remote = await framework.remote('dummies.origins')
})

afterAll(async () => {
  if (remote) await remote.disconnect()
  if (composition) await composition.disconnect()
})

it('should be available as context.extensions.origins', async () => {
  const reply = await remote.invoke('foo', { input: {} })

  expect(reply).toBeDefined()
  expect(reply.output).toStrictEqual({ status: 404 })
})

it('should be available as context.origins', async () => {
  const reply = await remote.invoke('bar', {})

  expect(reply).toBeDefined()
  expect(reply.output).toStrictEqual({ status: 404 })
})

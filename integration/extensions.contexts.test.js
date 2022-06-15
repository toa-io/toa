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

it('should be available thru context.extensions.origins', async () => {
  const reply = await remote.invoke('read', { input: {} })

  expect(reply).toBeDefined()
  expect(reply.output).toStrictEqual({ status: 404 })
})

it('should be available thru context.origins', async () => {
  const reply = await remote.invoke('fetch', {})

  expect(reply).toBeDefined()
  expect(reply.output).toStrictEqual({ status: 404 })
})

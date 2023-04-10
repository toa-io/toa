'use strict'

const { encode } = require('@toa.io/generic')

const framework = require('./framework')

let composition
let remote

beforeAll(async () => {
  framework.dev(true)

  composition = await framework.compose(['configured'])
  remote = await framework.remote('dummies.configured')
})

afterAll(async () => {
  if (remote) await remote.disconnect()
  if (composition) await composition.disconnect()

  framework.dev(false)
})

it('should connect', () => {
  expect(1).toBe(1)
})

it('should validate manifest', async () => {
  await expect(framework.compose(['configured-badly'])).rejects.toThrow(/must be equal to one of the allowed values/)
})

it('should provide context extension', async () => {
  const reply = await remote.invoke('transit', { input: {} })

  expect(reply.output.foo).toStrictEqual('Hello')
})

it('should provide context shortcut', async () => {
  const reply = await remote.invoke('underlay')

  expect(reply.output.foo).toStrictEqual('Hello')
  expect(reply.output.sum).toStrictEqual(3)
})

it('should resolve configuration object', async () => {
  const configuration = { foo: 'Bye', bar: { b: 3 } }
  process.env.TOA_CONFIGURATION_DUMMIES_CONFIGURED = encode(configuration)

  await composition.reconnect()

  const reply = await remote.invoke('underlay')

  expect(reply.output).toStrictEqual({ foo: configuration.foo, sum: 4 })
})

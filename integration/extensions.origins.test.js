'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')

const fixtures = require('./extensions.origins.fixtures')
const framework = require('./framework')

const server = fixtures.server

let composition
let remote

beforeAll(async () => {
  framework.env('toa_local')

  composition = await framework.compose(['origins'])
  remote = await framework.remote('dummies.origins')
  await fixtures.server.start()
})

afterAll(async () => {
  await fixtures.server.stop()
  if (remote) await remote.disconnect()
  if (composition) await composition.disconnect()

  framework.env()
})

it('should be available as context.extensions.origins', async () => {
  const status = 200
  const body = { [generate()]: generate() }

  server.respond(status, body)

  const reply = await remote.invoke('foo', {})

  expect(reply).toBeDefined()
  expect(reply.output).toStrictEqual({ status, body })
})

it('should be available as context.origins', async () => {
  const status = 200
  const body = { [generate()]: generate() }

  server.respond(status, body)

  const reply = await remote.invoke('foo', {})

  expect(reply).toBeDefined()
  expect(reply.output).toStrictEqual({ status, body })
})

it('should validate extension manifest', async () => {
  await expect(framework.compose(['origins-misformatted'])).rejects.toThrow(/origins\/local must be string/)
})

it('should retry', async () => {
  const status = 200
  const body = { [generate()]: generate() }
  const attempts = random(5) + 1

  for (let i = 0; i < attempts; i++) server.respond(500)

  server.respond(status, body)

  const reply = await remote.invoke('bar', { input: { retries: attempts } })

  expect(reply).toBeDefined()
  expect(reply.output).toStrictEqual({ status, body })
})

'use strict'

const { generate } = require('randomstring')
const { newid } = require('@toa.io/generic')
const framework = require('./framework')

let composition
/** @type {toa.core.Runtime} */
let remote

beforeAll(async () => {
  framework.dev(true)

  composition = await framework.compose(['nulls'])
  remote = await framework.remote('dummies.nulls')
})

afterAll(async () => {
  if (remote) await remote.disconnect()
  if (composition) await composition.disconnect()

  framework.dev(false)
})

it('should transit', async () => {
  const input = { bar: generate() }
  const reply = await remote.invoke('transit', { input })

  expect(reply).toStrictEqual({ output: { id: expect.any(String) } })
})

it('should return null on observe', async () => {
  const id = newid()

  const invoke = remote.invoke('observe', { query: { id } })

  await expect(invoke).resolves.toStrictEqual(null)
})

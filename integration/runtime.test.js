'use strict'

const { join } = require('node:path')

const boot = require('@toa.io/boot')
const { newid } = require('@toa.io/libraries/generic')

const path = join(__dirname, './dummies/credits')

let runtime

beforeAll(async () => {
  const manifest = await boot.component(path)

  runtime = await boot.runtime(manifest)

  await runtime.connect()
})

afterAll(async () => {
  if (runtime !== undefined) await runtime.disconnect()
})

it('should preform operations', async () => {
  const id = newid()

  await runtime.invoke('debit', { input: 1, query: { id } })
  const reply = await runtime.invoke('observe', { query: { id } })

  expect(reply.output).toStrictEqual({ id, balance: 9, _version: 1 })
})

'use strict'

const { join } = require('node:path')

const boot = require('@toa.io/boot')
const { newid } = require('@toa.io/generic')
const framework = require('./framework')

const path = join(__dirname, './dummies/credits')

let component

beforeAll(async () => {
  framework.env('toa_local')

  const manifest = await boot.manifest(path)

  component = await boot.component(manifest)

  await component.connect()
})

afterAll(async () => {
  if (component !== undefined) await component.disconnect()

  framework.env()
})

it('should preform operations', async () => {
  const id = newid()

  await component.invoke('debit', { input: 1, query: { id } })
  const reply = await component.invoke('observe', { query: { id } })

  expect(reply.output).toStrictEqual({ id, balance: 9, _version: 1 })
})

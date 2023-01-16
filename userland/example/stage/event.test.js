'use strict'

const { resolve } = require('node:path')
const { newid } = require('@toa.io/libraries/generic')
const stage = require('@toa.io/userland/stage')

const binding = stage.binding.binding
const root = resolve(__dirname, '../components')

/** @type {toa.core.Component} */
let remote

beforeAll(async () => {
  const path = resolve(root, 'tea/pots')

  await stage.composition([path])

  remote = await stage.remote('tea.pots')
})

afterEach(async () => {
  await stage.shutdown()
})

it('should book a pot', async () => {
  const payload = { id: newid() }
  const message = { payload }
  const request = { query: payload }

  await binding.emit('store.orders.created', message)

  const reply = await remote.invoke('observe', request)

  expect(reply.output.booked).toStrictEqual(true)
})

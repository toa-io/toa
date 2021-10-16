'use strict'

const fetch = require('node-fetch')
const { timeout } = require('@toa.io/gears')
const { id: newid } = require('@toa.io/core')
const extension = require('../extensions/resources')
const framework = require('./framework')

let composition, resources

beforeAll(async () => {
  composition = await framework.compose(['credits'])
  resources = await (new extension.Factory()).process()

  await resources.connect()
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (resources) await resources.disconnect()
})

it('should load', async () => {
  await timeout(100) // resources discovery

  const id = newid()
  const url = 'http://localhost:8000/credits/balance/' + id + '/'
  const reply = await fetch(url)
  const json = await reply.json()

  expect(json).toStrictEqual({ output: { id, balance: 10, _version: 0 } })
})

'use strict'

const { Locator } = require('@toa.io/core')

const framework = require('./framework')

let composition, discovery

beforeAll(async () => {
  composition = await framework.compose(['credits'])
  discovery = await framework.discovery()
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (discovery) await discovery.disconnect()
})

it('should lookup', async () => {
  const locator = new Locator('credits.balance')
  const reply = await discovery.lookup(locator)

  expect(reply.operations).toBeDefined()
  expect(reply.events).toBeDefined()
})

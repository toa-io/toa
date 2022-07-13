'use strict'

const { Locator } = require('@toa.io/core')

const framework = require('./framework')

let composition, discovery

beforeAll(async () => {
  framework.env('local')

  composition = await framework.compose(['credits'])
  discovery = await framework.discovery()
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (discovery) await discovery.disconnect()

  framework.env()
})

it('should lookup', async () => {
  const locator = new Locator('balance', 'credits')
  const reply = await discovery.lookup(locator)

  expect(reply.operations).toBeDefined()
  expect(reply.events).toBeDefined()
})

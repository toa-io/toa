'use strict'

const framework = require('./framework')

let composition, discovery

beforeAll(async () => {
  composition = await framework.compose(['credits'])
  discovery = await framework.discover()
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (discovery) await discovery.disconnect()
})

it('should lookup', async () => {
  const reply = await discovery.lookup('credits.balance')

  expect(reply.entity.properties.id).toBeDefined()
  expect(reply.operations).toBeDefined()
  expect(reply.events).toBeDefined()
})

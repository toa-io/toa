'use strict'

const framework = require('./framework')

let composition, discovery

beforeAll(async () => {
  composition = await framework.compose({ dummies: ['credits'] })
  discovery = await framework.discover('@kookaburra/bindings.amqp', 'credits.balance')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (discovery) await discovery.disconnect()
})

it('should lookup', async () => {
  const { output: locator } = await discovery.request('lookup')

  expect(locator.entity.schema.properties.id).toBeDefined()
  expect(locator.operations).toBeDefined()
  expect(locator.events).toBeDefined()
})

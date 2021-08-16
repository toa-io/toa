'use strict'

const fixtures = require('./connector.fixtures')
const mock = fixtures.mock

jest.mock('../src/client', () => ({ Client: mock.Client }))

const { Connector } = require('../src/connector')

let connector, client

beforeAll(() => {
  connector = new Connector(fixtures.locator)

  client = fixtures.mock.Client.mock.instances[0]
})

it('should define name', () => {
  expect(Connector.name).toBe('MongoDB')
})

it('should create client', () => {
  expect(client).toBeDefined()
})

it('should pass connection args', () => {
  expect(fixtures.mock.Client).toHaveBeenCalledWith(
    Connector.host(fixtures.locator),
    fixtures.locator.domain,
    fixtures.locator.entity
  )
})

it('should connect', async () => {
  await connector.connection()

  expect(client.connect).toHaveBeenCalled()
})

it('should disconnect', async () => {
  await connector.disconnection()

  expect(client.disconnect).toHaveBeenCalled()
})

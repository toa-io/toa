'use strict'

jest.mock('../src/connector')

const clone = require('clone-deep')

const { Connector } = require('../src/connector')
const { Emission } = require('../src/emission')
const fixtures = require('./emission.fixtures')

let emission, event

beforeEach(async () => {
  jest.clearAllMocks()

  emission = new Emission(fixtures.events)
  event = clone(fixtures.event)

  await emission.connection()
})

it('should depend on events', () => {
  expect(emission).toBeInstanceOf(Connector)
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.events)
})

it('should emit events', async () => {
  expect.assertions(fixtures.events.length)

  await emission.emit(event)

  for (const evt of fixtures.events) {
    expect(evt.emit).toHaveBeenCalledWith(event)
  }
})

'use strict'

jest.mock('../src/connector')

const clone = require('clone-deep')

const { Connector } = require('../src/connector')
const { Emission } = require('../src/emission')
const fixtures = require('./emission.fixtures')

let emission, event

beforeEach(async () => {
  jest.clearAllMocks()

  emission = new Emission(fixtures.producers, fixtures.events)
  event = clone(fixtures.event)

  await emission.connection()
})

it('should depend on events', () => {
  expect(emission).toBeInstanceOf(Connector)
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.events)
})

it('should emit with label, payload', async () => {
  expect.assertions(fixtures.events.length)

  await emission.emit(event)

  for (let i = 0; i < fixtures.events.length; i++) {
    expect(fixtures.producers[0].emit).toHaveBeenNthCalledWith(
      i + 1,
      fixtures.events[i].label,
      await fixtures.events[i].payload.mock.results[0].value
    )
  }
})

it('should test conditions with origin, changeset', async () => {
  await emission.emit(event)

  for (let i = 0; i < fixtures.events.length; i++) {
    expect(fixtures.events[i].condition).toHaveBeenCalledWith(event.origin, event.changeset)
  }
})

it('should not emit on failed condition', async () => {
  expect.assertions(fixtures.events.length)

  event.changeset.conditionFail = 1
  await emission.emit(event)

  expect(fixtures.producers[0].emit.mock.calls.length).toBe(fixtures.events.length - 1)

  let e = 0

  for (let i = 0; i < fixtures.events.length; i++) {
    if (i === event.changeset.conditionFail) continue

    e++

    expect(fixtures.producers[0].emit).toHaveBeenNthCalledWith(
      e,
      fixtures.events[i].label,
      await fixtures.events[i].payload.mock.results[0].value
    )
  }
})

it('should pick bindings sequentially', async () => {
  expect.assertions(fixtures.producers.length)

  event.state.emissionFail = 1
  await emission.emit(event)

  for (let i = 0; i < fixtures.producers.length; i++) {
    if (i > event.state.emissionFail) expect(fixtures.producers[i].emit).not.toHaveBeenCalled()
    else expect(fixtures.producers[i].emit).toHaveBeenCalledTimes(fixtures.events.length)
  }
})

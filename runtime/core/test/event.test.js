'use strict'

const clone = require('clone-deep')

jest.mock('../src/connector')

const { Connector } = require('../src/connector')
const { Event } = require('../src/event')
const fixtures = require('./event.fixtures')

let event

beforeEach(() => {
  jest.clearAllMocks()

  event = new Event(fixtures.definition, fixtures.binding, fixtures.bridge)
})

it('should depend on binding', () => {
  expect(event).toBeInstanceOf(Connector)
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.binding)
})

it('should depend on bridge if provided', () => {
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.bridge)

  event = new Event(fixtures.definition, fixtures.binding)
  expect(Connector.mock.instances[1].depends).not.toHaveBeenCalledWith(fixtures.bridge)
})

describe('condition', () => {
  describe('conditioned', () => {
    it('should call condition', async () => {
      await event.emit(fixtures.event.origin, fixtures.event.changeset, fixtures.event.state)

      expect(fixtures.bridge.condition).toHaveBeenCalledWith(fixtures.event.origin, fixtures.event.changeset)
    })
  })


  it('should call payload', async () => {
    const result = await event.payload(fixtures.event.state)

    expect(fixtures.bridge.payload).toHaveBeenCalledWith(fixtures.event.state)
    expect(result).toBe(await fixtures.bridge.payload.mock.results[0].value)
  })
})

describe('unconditioned', () => {
  const definition = clone(fixtures.definition)

  definition.conditioned = false

  beforeEach(() => {
    event = new Event(fixtures.label, definition)
  })

  it('should not call depends', () => {
    expect(Connector.mock.instances[0].depends).not.toHaveBeenCalled()
  })

  it('should fulfil condition', async () => {
    await expect(event.condition()).resolves.toBe(true)
  })
})

describe('objective', () => {
  const definition = clone(fixtures.definition)

  definition.subjective = false

  beforeEach(() => {
    event = new Event(fixtures.label, definition)
  })

  it('should not call payload', async () => {
    await event.payload()

    expect(fixtures.bridge.payload).not.toHaveBeenCalled()
  })

  it('should return state as payload', async () => {
    await expect(event.payload(fixtures.event.state)).resolves.toBe(fixtures.event.state)
  })
})

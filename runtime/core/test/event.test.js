'use strict'

const clone = require('clone-deep')

jest.mock('../src/connector')

const { Connector } = require('../src/connector')
const { Event } = require('../src/event')
const fixtures = require('./event.fixtures')

let event, emit

beforeEach(() => {
  jest.clearAllMocks()

  event = new Event(fixtures.definition, fixtures.binding, fixtures.bridge)
  emit = () => event.emit(fixtures.event.origin, fixtures.event.changeset, fixtures.event.state)
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
      await emit()

      expect(fixtures.bridge.condition).toHaveBeenCalledWith(fixtures.event.origin, fixtures.event.changeset)
    })

    it('should emit if condition returns true', async () => {
      await emit()

      expect(fixtures.binding.emit).toHaveBeenCalledWith(await fixtures.bridge.payload.mock.results[0].value)
    })

    it('should not emit if condition returns false', async () => {
      const origin = clone(fixtures.event.origin)

      origin.falsy = true

      await event.emit(origin, fixtures.event.changeset, fixtures.event.state)

      expect(fixtures.binding.emit).not.toHaveBeenCalled()
    })
  })

  describe('unconditioned', () => {
    beforeEach(() => {
      const definition = clone(fixtures.definition)

      definition.conditioned = false

      event = new Event(definition, fixtures.binding, fixtures.bridge)
    })

    it('should not call condition', async () => {
      await event.emit(fixtures.event.origin, fixtures.event.changeset, fixtures.event.state)

      expect(fixtures.bridge.condition).not.toHaveBeenCalledWith()
      expect(fixtures.binding.emit).toHaveBeenCalledWith(await fixtures.bridge.payload.mock.results[0].value)
    })
  })
})

describe('payload', () => {
  describe('subjective', () => {
    it('should emit payload', async () => {
      await emit()

      expect(fixtures.binding.emit).toHaveBeenCalledWith(await fixtures.bridge.payload.mock.results[0].value)
    })
  })

  describe('objective', () => {
    beforeEach(() => {
      const definition = clone(fixtures.definition)

      definition.subjective = false

      event = new Event(definition, fixtures.binding, fixtures.bridge)
      emit = () => event.emit(fixtures.event.origin, fixtures.event.changeset, fixtures.event.state)
    })

    it('should not call payload', async () => {
      await emit()

      expect(fixtures.bridge.payload).not.toHaveBeenCalled()
    })

    it('should return state as payload', async () => {
      await emit()

      expect(fixtures.binding.emit).toHaveBeenCalledWith(fixtures.event.state)
    })
  })
})

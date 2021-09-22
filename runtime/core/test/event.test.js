'use strict'

jest.mock('../src/connector')

const { Connector } = require('../src/connector')
const { Event } = require('../src/event')
const fixtures = require('./event.fixtures')

let event

beforeEach(() => jest.clearAllMocks())

it('should provide label', () => {
  event = new Event(fixtures.declaration)

  expect(event.label).toBe(fixtures.declaration.label)
})

describe('conditional', () => {
  beforeEach(() => {
    event = new Event(fixtures.declaration, fixtures.bridge)
  })

  it('should depend on bridge', () => {
    expect(event).toBeInstanceOf(Connector)
    expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.bridge)
  })

  it('should call condition', async () => {
    const result = await event.condition(fixtures.event.origin, fixtures.event.changeset)

    expect(fixtures.bridge.condition).toHaveBeenCalledWith(fixtures.event.origin, fixtures.event.changeset)
    expect(result).toBe(await fixtures.bridge.condition.mock.results[0].value)
  })

  it('should call payload', async () => {
    const result = await event.payload(fixtures.event.state)

    expect(fixtures.bridge.payload).toHaveBeenCalledWith(fixtures.event.state)
    expect(result).toBe(await fixtures.bridge.payload.mock.results[0].value)
  })
})

describe('unconditional', () => {
  beforeEach(() => {
    event = new Event(fixtures.declaration)
  })

  it('should not call depends', () => {
    expect(Connector.mock.instances[0].depends).not.toHaveBeenCalled()
  })

  it('should fulfil condition', async () => {
    await expect(event.condition()).resolves.toBe(true)
  })

  it('should return state as payload', async () => {
    await expect(event.payload(fixtures.event.state)).resolves.toBe(fixtures.event.state)
  })
})

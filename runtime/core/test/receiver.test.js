'use strict'

const clone = require('clone-deep')

jest.mock('../src/connector')

const { Connector } = require('../src/connector')

const { Receiver } = require('../src/receiver')
const fixtures = require('./receiver.fixtures')

let receiver, definition

beforeEach(() => {
  definition = clone(fixtures.definition)
  receiver = new Receiver(fixtures.definition, fixtures.apply, fixtures.bridge)
})

it('should depend on apply', () => {
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.apply)
})

it('should depend on bridge', () => {
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.bridge)
})

it('should apply', async () => {
  const payload = { foo: 'bar' }
  await receiver.receive(payload)

  expect(fixtures.apply.apply).toHaveBeenCalledWith(payload)
})

describe('conditioned', () => {
  beforeEach(() => {
    definition.conditioned = true
    receiver = new Receiver(definition, fixtures.apply, fixtures.bridge)
  })

  it('should test condition', async () => {
    const payload = { foo: 'bar' }
    await receiver.receive(payload)

    expect(fixtures.bridge.condition).toHaveBeenCalledWith(payload)
    expect(fixtures.apply.apply).toHaveBeenCalledWith(payload)
  })

  it('should not apply if condition is false', async () => {
    const payload = { reject: true }
    await receiver.receive(payload)

    expect(fixtures.apply.apply).not.toHaveBeenCalledWith(payload)
  })
})

describe('adaptive', () => {
  beforeEach(() => {
    definition.adaptive = true
    receiver = new Receiver(definition, fixtures.apply, fixtures.bridge)
  })

  it('should apply', async () => {
    const payload = { reject: true }
    await receiver.receive(payload)

    expect(fixtures.apply.apply).toHaveBeenCalledWith(fixtures.bridge.request.mock.results[0].value)
  })
})

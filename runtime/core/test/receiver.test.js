'use strict'

const clone = require('clone-deep')

jest.mock('../src/connector')

const { Connector } = /** @type {{ Connector: jest.Mock<toa.core.Connector>}} */ require('../src/connector')

const { Receiver } = require('../src/receiver')
const fixtures = require('./receiver.fixtures')
const { generate } = require('randomstring')

/** @type {toa.core.Receiver} */
let receiver
let definition

beforeEach(() => {
  jest.clearAllMocks()

  definition = clone(fixtures.definition)
  receiver = new Receiver(fixtures.definition, fixtures.local, fixtures.bridge)
})

it('should depend on local, bridge', () => {
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.local)
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.bridge)
})

it('should apply', async () => {
  const payload = { foo: 'bar' }

  await receiver.receive({ payload })

  expect(fixtures.local.invoke).toHaveBeenCalledWith(definition.transition, payload)
})

it('should apply foreign messages', async () => {
  // Foreign messages may not conform toa.core.Message type
  const message = { [generate()]: generate() }

  await receiver.receive(message)

  expect(fixtures.local.invoke).toHaveBeenCalledWith(definition.transition, message)
})

describe('conditioned', () => {
  beforeEach(() => {
    definition.conditioned = true
    receiver = new Receiver(definition, fixtures.local, fixtures.bridge)
  })

  it('should test condition', async () => {
    const payload = { foo: 'bar' }
    await receiver.receive({ payload })

    expect(fixtures.bridge.condition).toHaveBeenCalledWith(payload)
    expect(fixtures.local.invoke).toHaveBeenCalledWith(definition.transition, payload)
  })

  it('should not apply if condition is false', async () => {
    const payload = { reject: true }
    await receiver.receive({ payload })

    expect(fixtures.local.invoke).not.toHaveBeenCalled()
  })
})

describe('adaptive', () => {
  beforeEach(() => {
    definition.adaptive = true
    receiver = new Receiver(definition, fixtures.local, fixtures.bridge)
  })

  it('should apply', async () => {
    const payload = { reject: true }
    await receiver.receive({ payload })

    expect(fixtures.local.invoke)
      .toHaveBeenCalledWith(definition.transition, fixtures.bridge.request.mock.results[0].value)
  })
})

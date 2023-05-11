'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { merge } = require('@toa.io/generic')

jest.mock('../src/connector')

const { Connector } = /** @type {{ Connector: jest.Mock<toa.core.Connector>}} */ require('../src/connector')

const { Receiver } = require('../src/receiver')
const fixtures = require('./receiver.fixtures')

/** @type {toa.core.Receiver} */
let receiver

/** @type {toa.norm.component.Receiver} */
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

  expect(fixtures.local.invoke).toHaveBeenCalledWith(definition.operation, payload)
})

it.each([[false], [true]])('should pass UI extensions (adaptive: %s)', async (adaptive) => {
  jest.clearAllMocks()

  definition.adaptive = adaptive
  receiver = new Receiver(definition, fixtures.local, fixtures.bridge)

  const payload = { foo: generate() }
  const extension = { [generate()]: generate() }
  const message = { payload, ...extension }

  await receiver.receive(message)

  const request = adaptive ? await fixtures.bridge.request.mock.results[0].value : payload
  const expected = merge(clone(request), extension)

  const argument = fixtures.local.invoke.mock.calls[0][1]

  expect(argument).toStrictEqual(expected)
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
    expect(fixtures.local.invoke).toHaveBeenCalledWith(definition.operation, payload)
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
      .toHaveBeenCalledWith(definition.operation, await fixtures.bridge.request.mock.results[0].value)
  })
})

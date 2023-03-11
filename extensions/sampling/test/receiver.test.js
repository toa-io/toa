'use strict'

const { generate } = require('randomstring')
const { Locator, Connector } = require('@toa.io/core')

const { SampleException } = require('../src/exceptions')

const fixtures = require('./receiver.fixtures')
const { Factory } = require('../src')

/** @type {toa.core.extensions.Factory} */
const factory = new Factory()

/** @type {toa.core.Receiver} */
let receiver

/** @type {toa.core.Locator} */
let locator

const payload = { [generate()]: generate() }

/** @type {toa.sampling.Message} */
let message

beforeEach(() => {
  jest.clearAllMocks()

  const namespace = generate()
  const name = generate()

  message = { payload }

  locator = new Locator(namespace, name)
  receiver = factory.receiver(fixtures.receiver, locator)
})

it('should depend on original receiver', async () => {
  expect(receiver).toBeInstanceOf(Connector)
  expect(fixtures.receiver.link).toHaveBeenCalledWith(receiver)
})

it('should call original receiver', async () => {
  await receiver.receive(message)

  expect(fixtures.receiver.receive).toHaveBeenCalledWith(message)
})

it('should not call original receiver on component mismatch', async () => {
  message.sample = { component: generate(), request: {} }

  await receiver.receive(message)

  expect(fixtures.receiver.receive).not.toHaveBeenCalled()
})

it('should call original receiver on component match', async () => {
  message.sample = { component: locator.id, request: {} }

  await receiver.receive(message)

  expect(fixtures.receiver.receive).toHaveBeenCalled()
})

it('should pass sample.request as sample', async () => {
  const request = { title: generate() }

  message.sample = { component: locator.id, request }

  const expected = { ...message, sample: request }

  await receiver.receive(message)

  expect(fixtures.receiver.receive).toHaveBeenCalledWith(expected)
})

it('should throw on invalid sample', async () => {
  // noinspection JSValidateTypes
  message.sample = { foo: generate() }

  await expect(receiver.receive(message)).rejects.toBeInstanceOf(SampleException)
})

it('should not validate authentic sample', async () => {
  // noinspection JSValidateTypes
  message.sample = { authentic: true, foo: generate() }

  await expect(receiver.receive(message)).resolves.not.toThrow()
})

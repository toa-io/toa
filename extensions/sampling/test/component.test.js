'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const { SampleException, ReplyException } = require('../src/exceptions')

const fixtures = require('./component.fixtures')
const { Factory } = require('../')
const { Component } = require('../src/component')

const factory = new Factory()

/** @type {toa.core.Component} */
let component

const endpoint = generate()
const input = { foo: generate() }
const query = { id: generate() }

/** @type {toa.core.Request} */
let request

beforeEach(() => {
  jest.clearAllMocks()

  component = factory.component(fixtures.component)
  request = { input, query }
})

it('should be', () => {
  expect(component).toBeInstanceOf(Component)
  expect(component).toBeInstanceOf(Connector)
  expect(component.invoke).toBeDefined()
  expect(component.locator).toStrictEqual(fixtures.component.locator)
})

it('should depend on origin', () => {
  expect(fixtures.component.link).toHaveBeenCalledWith(component)
})

describe('validation', () => {
  it('should return exception if sample is invalid', async () => {
    request.sample = { foo: generate() }

    const reply = await component.invoke(endpoint, request)

    expect(reply.exception).toBeInstanceOf(SampleException)
  })

  it('should not throw if sample is not defined', async () => {
    await expect(component.invoke(endpoint, request)).resolves.not.toThrow()
  })
})

describe('invocation', () => {
  /** @type {toa.core.Reply} */
  let reply

  beforeEach(async () => {
    reply = await component.invoke(endpoint, request)
  })

  it('should invoke operation', async () => {
    expect(fixtures.component.invoke).toHaveBeenCalledWith(endpoint, request)
  })

  it('should return reply', async () => {
    expect(reply).toStrictEqual(await fixtures.component.invoke.mock.results[0].value)
  })
})

describe('verification', () => {
  it('should add exception on reply mismatch', async () => {
    request.sample = { reply: { output: generate() } }

    const reply = await component.invoke(endpoint, request)

    expect(reply.exception).toBeInstanceOf(ReplyException)
  })

  it('should not throw if reply exactly matches', async () => {
    request.sample = { reply: { output: generate() } }
    fixtures.component.invoke.mockImplementationOnce(async () => request.sample.reply)

    const reply = await component.invoke(endpoint, request)

    expect(reply.exception).toBeUndefined()
  })

  it('should not throw if reply matches', async () => {
    request.sample = { reply: { output: generate() } }

    const mocked = { ...request.sample.reply, extra: 1 }

    fixtures.component.invoke.mockImplementationOnce(async () => mocked)

    const reply = await component.invoke(endpoint, request)

    expect(reply.exception).toBeUndefined()
  })
})

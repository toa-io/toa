'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const { SampleException, ReplayException } = require('../src/exceptions')

const fixtures = require('./component.fixtures')
const { Factory } = require('../')
const { Component } = require('../src/component')
const { context } = require('../src/sample')

const factory = new Factory()

/** @type {toa.core.Component} */
let component

const endpoint = generate()

/** @type {toa.sampling.Request} */
let request

beforeEach(() => {
  jest.clearAllMocks()

  const input = { foo: generate() }
  const query = { criteria: generate() }

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

describe('verification', () => {
  it('should throw if sample is invalid', async () => {
    // noinspection JSValidateTypes
    request.sample = { foo: generate() }

    await expect(component.invoke(endpoint, request)).rejects.toBeInstanceOf(SampleException)
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

  it('should set sampling context', async () => {
    expect.assertions(2)

    request.sample = {
      context: {
        local: {
          undo: [{
            reply: {
              output: generate()
            }
          }]
        }
      }
    }

    let undo

    fixtures.component.invoke.mockImplementationOnce(async () => {
      const sample = context.get()

      expect(sample).toBeDefined()

      undo = sample.context.local.undo
    })

    await component.invoke(endpoint, request)

    expect(undo).toStrictEqual(request.sample.context.local.undo)
  })

  it('should add request.query if current state is provided', async () => {
    jest.clearAllMocks()

    const storage = { current: { foo: generate() } }

    delete request.query
    request.sample = { storage }

    await expect(component.invoke(endpoint, request))

    const argument = await fixtures.component.invoke.mock.calls[0][1]

    expect(argument.query?.id).toBeDefined()
  })
})

describe('verification', () => {
  describe('request', () => {
    it('should throw on request mismatch', async () => {
      request.sample = { request }
    })
  })

  describe('reply', () => {
    it('should throw exception on reply mismatch', async () => {
      request.sample = { reply: { output: generate() } }

      await expect(component.invoke(endpoint, request)).rejects.toBeInstanceOf(ReplayException)
    })

    it('should not throw exception if reply exactly matches', async () => {
      request.sample = { reply: { output: generate() } }
      fixtures.component.invoke.mockImplementationOnce(async () => request.sample.reply)

      await expect(component.invoke(endpoint, request)).resolves.toBeDefined()
    })

    it('should not throw exception if reply matches', async () => {
      request.sample = { reply: { output: generate() } }

      const mocked = { ...request.sample.reply, extra: 1 }

      fixtures.component.invoke.mockImplementationOnce(async () => mocked)

      await expect(component.invoke(endpoint, request)).resolves.toBeDefined()
    })
  })

  describe('events', () => {
    it('should throw exception if sample.events is not empty', async () => {
      request.sample = { events: { created: { payload: {} } } }

      await expect(component.invoke(endpoint, request)).rejects.toBeInstanceOf(ReplayException)
    })
  })
})

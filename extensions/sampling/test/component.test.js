'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const { context } = require('@toa.io/libraries/generic')
const { SampleException, ReplyException } = require('../src/exceptions')

const fixtures = require('./component.fixtures')
const { Factory } = require('../')
const { Component } = require('../src/component')

const factory = new Factory()

/** @type {toa.core.Component} */
let component

const endpoint = generate()

/** @type {toa.core.Request} */
let request

beforeEach(() => {
  jest.clearAllMocks()

  const input = { foo: generate() }
  const query = { id: generate() }

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
  it('should throw if sample is invalid', async () => {
    request.sample = { foo: generate() }

    await expect(component.invoke(endpoint, request)).rejects.toBeInstanceOf(SampleException)
  })

  it('should not throw if sample is not defined', async () => {
    await expect(component.invoke(endpoint, request)).resolves.not.toThrow()
  })

  it('should throw if sample context is invalid', async () => {
    request.sample = { context: 'not-an-object' }

    await expect(component.invoke(endpoint, request)).rejects.toBeInstanceOf(SampleException)
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
          undo: {
            reply: {
              output: generate()
            }
          }
        }
      }
    }

    let undo

    fixtures.component.invoke.mockImplementationOnce(async () => {
      const storage = context('sampling')
      const sample = storage.get()

      expect(sample).toBeDefined()

      undo = sample.local.undo
    })

    await component.invoke(endpoint, request)

    expect(undo).toStrictEqual(request.sample.context.local.undo)
  })
})

describe('verification', () => {
  it('should add exception on reply mismatch', async () => {
    request.sample = { reply: { output: generate() } }

    const reply = await component.invoke(endpoint, request)

    expect(reply.exception).toBeInstanceOf(ReplyException)
  })

  it('should not add exception if reply exactly matches', async () => {
    request.sample = { reply: { output: generate() } }
    fixtures.component.invoke.mockImplementationOnce(async () => request.sample.reply)

    const reply = await component.invoke(endpoint, request)

    expect(reply.exception).toBeUndefined()
  })

  it('should not add exception if reply matches', async () => {
    request.sample = { reply: { output: generate() } }

    const mocked = { ...request.sample.reply, extra: 1 }

    fixtures.component.invoke.mockImplementationOnce(async () => mocked)

    const reply = await component.invoke(endpoint, request)

    expect(reply.exception).toBeUndefined()
  })
})

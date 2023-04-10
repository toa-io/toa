'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { encode } = require('@toa.io/generic')

const { Pointer } = require('../source/pointer')

/** @type {toa.core.Locator} */
let locator

/** @type {Pointer} */
let pointer

const protocol = 'amqp:'

let url

beforeAll(() => {
  const username = generate()
  const password = generate()

  url = new URL('amqps://whatever:5672')

  url.username = username
  url.password = password

  process.env.TOA_BINDINGS_AMQP_DEFAULT_USERNAME = username
  process.env.TOA_BINDINGS_AMQP_DEFAULT_PASSWORD = password
})

beforeEach(() => {
  const name = generate()
  const namespace = generate()
  const uris = { default: url.href }
  const value = encode(uris)
  const key = 'TOA_BINDINGS_AMQP_POINTER'

  process.env[key] = value

  locator = new Locator(name, namespace)
  pointer = new Pointer(locator)
})

it('should be', () => undefined)

it('should expose reference', () => {
  expect(pointer.reference).toStrictEqual(url.href)
})

it('should set amqp: protocol on localhost', () => {
  process.env.TOA_ENV = 'toa_local'

  pointer = new Pointer(locator)

  expect(pointer.protocol).toStrictEqual(protocol)

  delete process.env.TOA_ENV
})

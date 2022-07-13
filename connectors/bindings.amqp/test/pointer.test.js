'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { encode, letters: { up } } = require('@toa.io/libraries/generic')

const { Pointer } = require('../src/pointer')
const { PREFIX } = require('../src/constants')

/** @type {toa.core.Locator} */
let locator

/** @type {toa.amqp.Pointer} */
let pointer

const protocol = 'amqp:'

let url

beforeEach(() => {
  url = url = new URL('amqps://whatever:5672')

  const name = generate()
  const namespace = generate()
  const uris = { default: url.href }
  const value = encode(uris)
  const key = `TOA_${up(PREFIX)}_POINTER`

  process.env[key] = value

  locator = new Locator(name, namespace)
  pointer = new Pointer(locator)
})

it('should be', () => undefined)

it('should expose reference', () => {
  url.hostname = locator.hostname(PREFIX)
  expect(pointer.reference).toStrictEqual(url.href)
})

it('should set amqp: protocol on localhost', () => {
  process.env.TOA_ENV = 'local'

  pointer = new Pointer(locator)

  expect(pointer.protocol).toStrictEqual(protocol)

  delete process.env.TOA_ENV
})

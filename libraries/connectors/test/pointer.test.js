'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { random } = require('@toa.io/libraries/generic')

const { Pointer } = require('../')

it('should be', () => {
  expect(Pointer).toBeDefined()
  expect(Pointer).toBeInstanceOf(Function)
})

const protocol = 'schema:'

/** @type {toa.connectors.pointer.Options} */
let options

/** @type {toa.core.Locator} */
let locator

/** @type {toa.connectors.Pointer} */
let pointer

beforeEach(() => {
  const name = generate()
  const namespace = generate()

  options = { port: random(1000) + 1000 }

  locator = new Locator(name, namespace)
  pointer = new Pointer(locator, protocol, options)
})

it('should expose protocol', () => {
  expect(pointer.protocol).toStrictEqual(protocol)
})

it('should expose hostname', () => {
  expect(pointer.hostname).toStrictEqual(locator.hostname())
})

it('should expose hostname with prefix', () => {
  options.prefix = 'prefix'

  pointer = new Pointer(locator, protocol, options)

  expect(pointer.hostname).toStrictEqual(locator.hostname(options.prefix))
})

it('should expose localhost on local environment', () => {
  process.env.TOA_ENV = 'local'

  pointer = new Pointer(locator, protocol, options)

  expect(pointer.hostname).toStrictEqual('localhost')
  expect(pointer.reference).toStrictEqual(`${protocol}//localhost:${options.port}`)

  delete process.env.TOA_ENV
})

it('should expose port', () => {
  expect(pointer.port).toStrictEqual(options.port.toString())
})

it('should expose reference', () => {
  const hostname = locator.hostname()

  expect(pointer.reference).toStrictEqual(`${protocol}//${hostname}:${options.port}`)
})

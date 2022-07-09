'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { random, letters: { up } } = require('@toa.io/libraries/generic')

const { Pointer } = require('../')

it('should be', () => {
  expect(Pointer).toBeDefined()
  expect(Pointer).toBeInstanceOf(Function)
})

const protocol = 'schema:'
const prefix = 'bindings-amqp'

/** @type {toa.connectors.pointer.Options} */
let options

/** @type {toa.core.Locator} */
let locator

/** @type {toa.connectors.Pointer} */
let pointer

beforeEach(() => {
  const name = generate()
  const namespace = generate()

  options = { port: random(1000) + 1000, prefix }

  locator = new Locator(name, namespace)
  pointer = new Pointer(locator, protocol, options)
})

it('should expose protocol', () => {
  expect(pointer.protocol).toStrictEqual(protocol)
})

it('should expose hostname', () => {
  expect(pointer.hostname).toStrictEqual(locator.hostname(prefix))
})

it('should expose hostname without prefix', () => {
  delete options.prefix

  pointer = new Pointer(locator, protocol, options)

  expect(pointer.hostname).toStrictEqual(locator.hostname())
})

it('should expose localhost on local environment', () => {
  process.env.TOA_ENV = 'local'

  pointer = new Pointer(locator, protocol, options)

  delete process.env.TOA_ENV

  expect(pointer.hostname).toStrictEqual('localhost')
})

it('should use default credentials on local environment', () => {
  process.env.TOA_ENV = 'local'

  pointer = new Pointer(locator, protocol, options)

  delete process.env.TOA_ENV

  expect(pointer.reference).toStrictEqual(`${protocol}//developer:secret@localhost:${options.port}`)
  expect(pointer.label).toStrictEqual(`${protocol}//developer@localhost:${options.port}`)
})

it('should expose port', () => {
  expect(pointer.port).toStrictEqual(options.port.toString())
})

it('should expose reference', () => {
  const hostname = locator.hostname(prefix)

  expect(pointer.reference).toStrictEqual(`${protocol}//${hostname}:${options.port}`)
})

it('should not throw on undefined port', () => {
  delete options.port

  expect(() => new Pointer(locator, protocol, options)).not.toThrow()
})

it('should support options.path', () => {
  options.path = '/' + generate()

  pointer = new Pointer(locator, protocol, options)

  const reference = `${protocol}//${locator.hostname(prefix)}:${options.port}${options.path}`

  expect(pointer.path).toStrictEqual(options.path)
  expect(pointer.reference).toStrictEqual(reference)
})

describe('environment variables', () => {
  const username = generate()
  const password = generate()

  beforeEach(() => {
    const type = up(prefix)
    const env = `TOA_${type}_${locator.uppercase}`

    const set = (name, value) => {
      const key = env + '_' + up(name)

      process.env[key] = value
    }

    set('username', username)
    set('password', password)

    pointer = new Pointer(locator, protocol, options)
  })

  afterEach(() => {
    const type = up(prefix)
    const env = `TOA_${type}_${locator.uppercase}`

    const unset = (name) => {
      const key = env + '_' + up(name)

      delete process.env[key]
    }

    unset('username')
    unset('password')
  })

  it('should use env variables', () => {
    const hostname = locator.hostname(prefix)

    expect(pointer.reference).toStrictEqual(`${protocol}//${username}:${password}@${hostname}:${options.port}`)
    expect(pointer.label).toStrictEqual(`${protocol}//${username}@${hostname}:${options.port}`)
  })
})

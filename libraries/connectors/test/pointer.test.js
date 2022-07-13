'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { letters: { up } } = require('@toa.io/libraries/generic')

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

  options = { prefix }

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

  expect(pointer.reference).toStrictEqual(`${protocol}//developer:secret@localhost`)
  expect(pointer.label).toStrictEqual(`${protocol}//developer@localhost`)
})

it('should expose reference', () => {
  const hostname = locator.hostname(prefix)

  expect(pointer.reference).toStrictEqual(`${protocol}//${hostname}`)
})

it('should not throw on undefined port', () => {
  delete options.port

  expect(() => new Pointer(locator, protocol, options)).not.toThrow()
})

it('should support options.path', () => {
  options.path = '/' + generate()

  pointer = new Pointer(locator, protocol, options)

  const reference = `${protocol}//${locator.hostname(prefix)}${options.path}`

  expect(pointer.path).toStrictEqual(options.path)
  expect(pointer.reference).toStrictEqual(reference)
})

describe('environment variables', () => {
  const username = generate()
  const password = generate()

  let set
  let unset

  beforeEach(() => {
    const type = up(prefix)
    const env = `TOA_${type}_${locator.uppercase}`

    set = (name, value) => {
      const key = env + '_' + up(name)

      process.env[key] = value
    }

    unset = (name) => {
      const key = env + '_' + up(name)

      delete process.env[key]
    }

    set('username', username)
    set('password', password)
  })

  afterEach(() => {
    unset('username')
    unset('password')
  })

  it('should use env variables for credentials', () => {
    const hostname = locator.hostname(prefix)

    pointer = new Pointer(locator, protocol, options)

    expect(pointer.reference).toStrictEqual(`${protocol}//${username}:${password}@${hostname}`)
    expect(pointer.label).toStrictEqual(`${protocol}//${username}@${hostname}`)
  })

  it('should use env variable for protocol', () => {
    set('protocol', 'secure:')

    pointer = new Pointer(locator, protocol, options)

    unset('protocol')

    expect(pointer.protocol).toStrictEqual('secure:')
  })

  it('should use env variable for port', () => {
    const hostname = locator.hostname(prefix)
    set('port', '3000')

    pointer = new Pointer(locator, protocol, options)

    unset('port')

    expect(pointer.port).toStrictEqual('3000')
    expect(pointer.reference).toStrictEqual(`${protocol}//${username}:${password}@${hostname}:3000`)
  })
})

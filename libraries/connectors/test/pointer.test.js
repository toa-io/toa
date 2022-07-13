'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { encode, letters: { up } } = require('@toa.io/libraries/generic')

const { Pointer } = require('../')

it('should be', () => {
  expect(Pointer).toBeDefined()
  expect(Pointer).toBeInstanceOf(Function)
})

const prefix = 'bindings-amqp'
const protocol = 'schema:'

/** @type {toa.core.Locator} */
let locator

/** @type {toa.connectors.Pointer} */
let pointer

/** @type {URL} */
let url

const uris = (uris) => {
  const json = JSON.stringify(uris)

  process.env[`TOA_${up(prefix)}_POINTER`] = encode(json)
}

beforeEach(() => {
  const name = generate()
  const namespace = generate()

  locator = new Locator(name, namespace)

  url = new URL('amqp://whatever')

  uris({ default: url.href })
})

it('should throw if env not set', () => {
  const name = `TOA_${up(prefix)}_POINTER`
  delete process.env[name]

  expect(() => new Pointer(prefix, locator)).toThrow(`Environment variable ${name} is not set`)
})

it('should use declared protocol', () => {
  pointer = new Pointer(prefix, locator)

  expect(pointer.protocol).toStrictEqual(url.protocol)
})

it('should point to proxy', () => {
  pointer = new Pointer(prefix, locator)

  expect(pointer.hostname).toStrictEqual(locator.hostname(prefix))
})

it('should expose reference', () => {
  pointer = new Pointer(prefix, locator)

  url.hostname = locator.hostname(prefix)

  expect(pointer.reference).toStrictEqual(url.href)
})

it('should use localhost and given protocol on local environment', () => {
  process.env.TOA_ENV = 'local'

  pointer = new Pointer(prefix, locator, protocol)

  delete process.env.TOA_ENV

  expect(pointer.hostname).toStrictEqual('localhost')
  expect(pointer.protocol).toStrictEqual(protocol)
})

it('should use default protocol and credentials on local environment', () => {
  process.env.TOA_ENV = 'local'

  pointer = new Pointer(prefix, locator, protocol)

  delete process.env.TOA_ENV

  expect(pointer.reference).toStrictEqual(`${protocol}//developer:secret@localhost`)
  expect(pointer.label).toStrictEqual(`${protocol}//developer@localhost`)
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
      url[name] = value
    }

    unset = (name) => {
      const key = env + '_' + up(name)

      delete process.env[key]
      url[name] = ''
    }

    set('username', username)
    set('password', password)
  })

  afterEach(() => {
    unset('username')
    unset('password')
  })

  it('should use env variables for credentials', () => {
    pointer = new Pointer(prefix, locator)

    url.hostname = locator.hostname(prefix)

    expect(pointer.reference).toStrictEqual(url.href)

    url.password = ''

    expect(pointer.label).toStrictEqual(url.href)
  })
})

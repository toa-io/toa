'use strict'

const mock = { console: { info: jest.fn(), warn: jest.fn() } }

jest.mock('@toa.io/libraries/console', () => mock)

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { encode, letters: { up } } = require('@toa.io/libraries/generic')

const { Pointer } = require('../')

it('should be', () => {
  expect(Pointer).toBeDefined()
  expect(Pointer).toBeInstanceOf(Function)
})

const prefix = 'bindings-amqp'

/** @type {toa.core.Locator} */
let locator

/** @type {toa.pointer.Options} */
const options = { protocol: 'protocol:' }

/** @type {toa.pointer.Pointer} */
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

  expect(() => new Pointer(prefix, locator, options)).toThrow(`Environment variable ${name} is not set`)
})

it('should use declared protocol', () => {
  pointer = new Pointer(prefix, locator, options)

  expect(pointer.protocol).toStrictEqual(url.protocol)
})

it('should point to proxy', () => {
  pointer = new Pointer(prefix, locator, options)

  expect(pointer.hostname).toStrictEqual(locator.hostname(prefix))
})

it('should expose reference', () => {
  pointer = new Pointer(prefix, locator, options)

  url.hostname = locator.hostname(prefix)

  expect(pointer.reference).toStrictEqual(url.href)
})

it('should use localhost and given protocol on local environment', () => {
  process.env.TOA_ENV = 'local'

  pointer = new Pointer(prefix, locator, options)

  delete process.env.TOA_ENV

  expect(pointer.hostname).toStrictEqual('localhost')
  expect(pointer.protocol).toStrictEqual(options.protocol)
})

it('should use default protocol and credentials on local environment', () => {
  process.env.TOA_ENV = 'local'

  pointer = new Pointer(prefix, locator, options)

  delete process.env.TOA_ENV

  expect(pointer.reference).toStrictEqual(`${options.protocol}//developer:secret@localhost`)
  expect(pointer.label).toStrictEqual(`${options.protocol}//developer@localhost`)
})

describe('environment variables', () => {
  const username = generate()
  const password = generate()

  let set
  let unset

  beforeEach(() => {
    jest.clearAllMocks()

    const type = up(prefix)
    const env = `TOA_${type}_DEFAULT`

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
    pointer = new Pointer(prefix, locator, options)

    url.hostname = locator.hostname(prefix)

    expect(pointer.reference).toStrictEqual(url.href)

    url.password = ''

    expect(pointer.label).toStrictEqual(url.href)
  })

  it('should warn if username is not set', () => {
    url.hostname = locator.hostname(prefix)

    unset('username')
    url.password = ''

    const pointer = new Pointer(prefix, locator, options)

    expect(pointer).toBeDefined()
    expect(mock.console.warn).toHaveBeenCalledWith(`username for ${url.href} is not set`)
  })

  it('should warn if password is not set', () => {
    url.hostname = locator.hostname(prefix)

    unset('password')

    const pointer = new Pointer(prefix, locator, options)

    expect(pointer).toBeDefined()
    expect(mock.console.warn).toHaveBeenCalledWith(`password for ${url.href} is not set`)
  })
})

describe('validate', () => {
  it('should validate call validator', () => {
    const message = generate()
    const validate = jest.fn(() => { throw new Error(message) })

    options.validate = validate

    expect(() => new Pointer(prefix, locator, options)).toThrow(message)
    expect(validate).toHaveBeenCalled()
  })

  it('should pass url to update', () => {
    const path = '/' + generate()

    options.validate = (url) => (url.pathname = path)

    const pointer = new Pointer(prefix, locator, options)

    expect(pointer.path).toStrictEqual(path)
  })
})

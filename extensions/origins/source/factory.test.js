'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { sample, overwrite, letters: { up } } = require('@toa.io/generic')

jest.mock('./protocols/http/aspect')
jest.mock('./protocols/amqp/aspect')

const http = require('./protocols/http/aspect')
const amqp = require('./protocols/amqp/aspect')

const fixtures = require('./.test/factory.fixtures')
const { Factory } = require('../')

/** @type {toa.core.extensions.Factory} */
let factory

beforeEach(() => {
  jest.clearAllMocks()

  factory = new Factory()
})

it('should create aspects', () => {
  factory.aspect(new Locator(generate(), generate()), fixtures.manifest)

  const httpManifest = filterManifest(fixtures.manifest, 'http')
  const amqpManifest = filterManifest(fixtures.manifest, 'amqp')

  expect(http.create).toHaveBeenCalledWith(httpManifest)
  expect(amqp.create).toHaveBeenCalledWith(amqpManifest)
})

describe('env', () => {
  it('should overwrites URLs from environment', async () => {
    const httpManifest = filterManifest(fixtures.manifest, 'http')
    const key = sample(Object.keys(httpManifest))
    const override = { [key]: 'http://' + generate() }
    const json = JSON.stringify(override)
    const base64 = btoa(json)
    const locator = new Locator(generate(), generate())

    process.env['TOA_ORIGINS_' + locator.uppercase] = base64

    factory.aspect(locator, fixtures.manifest)

    const expected = overwrite(httpManifest, override)

    expect(http.create).toHaveBeenCalledWith(expected)
  })

  describe('amqp', () => {
    /** @type {toa.origins.Manifest} */
    let amqpManifest

    beforeEach(() => {
      amqpManifest = filterManifest(fixtures.manifest, 'amqp')
    })

    it('should add credentials from environment', async () => {
      const key = sample(Object.keys(amqpManifest))
      const locator = new Locator(generate(), generate())
      const envPrefix = 'TOA_ORIGINS_' + locator.uppercase + '_' + up(key) + '_'
      const username = generate()
      const password = generate()

      process.env[envPrefix + 'USERNAME'] = username
      process.env[envPrefix + 'PASSWORD'] = password

      factory.aspect(locator, amqpManifest)

      const manifest = amqp.create.mock.calls[0][0]
      const origin = manifest[key]
      const url = new URL(origin)

      expect(url.username).toStrictEqual(username)
      expect(url.password).toStrictEqual(password)
    })

    it('should add credentials to URLs from environment', async () => {
      const key = sample(Object.keys(amqpManifest))
      const hostname = generate().toLowerCase()
      const override = { [key]: 'amqp://' + hostname }
      const json = JSON.stringify(override)
      const base64 = btoa(json)
      const locator = new Locator(generate(), generate())
      const envPrefix = 'TOA_ORIGINS_' + locator.uppercase + '_' + up(key) + '_'
      const username = generate()
      const password = generate()

      process.env['TOA_ORIGINS_' + locator.uppercase] = base64
      process.env[envPrefix + 'USERNAME'] = username
      process.env[envPrefix + 'PASSWORD'] = password

      factory.aspect(locator, fixtures.manifest)

      const manifest = amqp.create.mock.calls[0][0]
      const origin = manifest[key]
      const url = new URL(origin)

      expect(url.hostname).toStrictEqual(hostname)
      expect(url.username).toStrictEqual(username)
      expect(url.password).toStrictEqual(password)
    })
  })
})

/**
 * @param {toa.origins.Manifest} manifest
 * @param {string} protocol
 * @return {toa.origins.Manifest}
 */
function filterManifest (manifest, protocol) {
  const result = {}

  for (const [origin, reference] of Object.entries(manifest)) {
    if (reference.slice(0, protocol.length) === protocol) result[origin] = reference
  }

  return result
}

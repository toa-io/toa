'use strict'

const { generate } = require('randomstring')
const { encode } = require('@toa.io/generic')

const { Provider } = require('../src/provider')

it('should be', async () => {
  expect(Provider).toBeInstanceOf(Function)
})

const locator = /** @type {toa.core.Locator} */ { uppercase: generate().toUpperCase() }
const schema = /** @type {toa.schema.Schema} */ { validate: () => undefined }

/** @type {Provider} */
let provider

beforeEach(() => {
  provider = new Provider(locator, schema)
})

it('should replace secret values', async () => {
  const configuration = { foo: '$FOO_SECRET' }
  const secrets = { FOO_SECRET: generate() }

  setEnv(configuration, secrets)

  await provider.open()
  const value = provider.source()

  expect(value).toStrictEqual({ foo: secrets.FOO_SECRET })
})

it('should throw if secret value is not set', async () => {
  const configuration = { foo: '$FOO_SECRET' }

  setEnv(configuration)

  await expect(provider.open()).rejects.toThrow('FOO_SECRET is not set')
})

/**
 * @param {object} configuration
 * @param {Record<string, string>} [secrets]
 */
function setEnv (configuration, secrets) {
  process.env[PREFIX + locator.uppercase] = encode(configuration)

  if (secrets !== undefined) {
    for (const [key, value] of Object.entries(secrets)) process.env[PREFIX + '_' + key] = encode(value)
  }
}

const PREFIX = 'TOA_CONFIGURATION_'

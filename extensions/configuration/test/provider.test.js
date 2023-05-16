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
  cleanEnv()
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

it('should replace nested secrets', async () => {
  const configuration = { foo: { bar: '$BAR' } }
  const secrets = { BAR: generate() }

  setEnv(configuration, secrets)

  await provider.open()
  const value = provider.source()

  expect(value).toStrictEqual({ foo: { bar: secrets.BAR } })
})

const usedVariables = []

/**
 * @param {object} configuration
 * @param {Record<string, string>} [secrets]
 */
function setEnv (configuration, secrets) {
  const variable = PREFIX + locator.uppercase

  setVal(variable, configuration)

  if (secrets !== undefined) {
    for (const [key, value] of Object.entries(secrets)) {
      const variable = PREFIX + '_' + key

      process.env[variable] = encode(value)
      usedVariables.push(variable)
    }
  }
}

function setVal (variable, value) {
  process.env[variable] = encode(value)
  usedVariables.push(variable)
}

function cleanEnv () {
  for (const variable of usedVariables) {
    delete process.env[variable]
  }

  usedVariables.length = 0
}

const PREFIX = 'TOA_CONFIGURATION_'

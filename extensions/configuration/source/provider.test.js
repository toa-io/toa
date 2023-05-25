'use strict'

/* eslint-disable no-template-curly-in-string */

const { generate } = require('randomstring')
const { encode } = require('@toa.io/generic')

const { Provider } = require('./provider')

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

it('should replace placeholders', async () => {
  const name = 'FOO_VALUE'
  const configuration = { foo: { bar: 'foo_${' + name + '}' } }
  const value = generate()

  setEnv(configuration)
  setVal(name, value)

  await provider.open()
  const source = provider.source()

  expect(source).toStrictEqual({ foo: { bar: 'foo_' + value } })
})

it('should replace multiple placeholders', async () => {
  const configuration = { foo: '${FOO} ${BAR}' }

  setEnv(configuration)
  setVal('FOO', 'hello')
  setVal('BAR', 'world')

  await provider.open()
  const source = provider.source()

  expect(source).toStrictEqual({ foo: 'hello world' })
})

it('should throw if variable not set', async () => {
  const configuration = { foo: '${FOO}' }

  setEnv(configuration)

  await expect(provider.open()).rejects.toThrow('not set')
})

const usedVariables = []

/**
 * @param {object} configuration
 * @param {Record<string, string>} [secrets]
 */
function setEnv (configuration, secrets) {
  const variable = PREFIX + locator.uppercase
  const encoded = encode(configuration)

  setVal(variable, encoded)

  if (secrets !== undefined) {
    for (const [key, value] of Object.entries(secrets)) {
      const variable = PREFIX + '_' + key

      process.env[variable] = encode(value)
      usedVariables.push(variable)
    }
  }
}

function setVal (variable, value) {
  process.env[variable] = value
  usedVariables.push(variable)
}

function cleanEnv () {
  for (const variable of usedVariables) {
    delete process.env[variable]
  }

  usedVariables.length = 0
}

const PREFIX = 'TOA_CONFIGURATION_'

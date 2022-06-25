'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')

const boot = require('@toa.io/boot')
const { random } = require('@toa.io/libraries/generic')

const { Factory } = require('@toa.io/extensions.configuration')

const PATH = resolve(__dirname, './dummies/configured')
const KEY = 'TOA_CONFIGURATION_DUMMIES_CONFIGURED'

/**
 * @param {Object} [value]
 */
const env = (value) => {
  if (value === undefined) return process.env[KEY] && JSON.parse(process.env[KEY])
  else process.env[KEY] = JSON.stringify(value)
}

/** @type {toa.extensions.configuration.Factory} */
const factory = new Factory()

/** @type {toa.extensions.configuration.Provider} */
let provider

beforeEach(async () => {
  delete process.env[KEY]

  const component = await boot.component(PATH)

  provider = factory.provider(component)
})

it('should start', () => {
  expect(provider).toBeDefined()
})

describe('set', () => {
  it('should update env', async () => {
    await provider.connect()

    const foo = generate()

    await provider.set('foo', foo)

    const object = env()

    expect(object).toStrictEqual({ foo })
  })

  it('should keep old keys', async () => {
    const before = { bar: { a: random() } }

    env(before)

    await provider.connect()
    await provider.set('foo', generate())

    const after = env()

    expect(after).toMatchObject(before)
  })

  it('should set nested with dot notation', async () => {
    const a = random()

    await provider.connect()
    await provider.set('bar.a', a)

    const object = env()

    expect(object).toStrictEqual({ bar: { a } })
  })

  it('should validate type', async () => {
    await provider.connect()

    await expect(() => provider.set('bar.a', generate())).rejects.toThrow(TypeError)
  })
})

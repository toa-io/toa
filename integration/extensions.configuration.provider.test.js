'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')

const boot = require('@toa.io/boot')
const { encode, random } = require('@toa.io/libraries/generic')

const { Factory } = require('@toa.io/extensions.configuration')

const PATH = resolve(__dirname, './dummies/configured')
const KEY = 'TOA_CONFIGURATION_DUMMIES_CONFIGURED'

/**
 * @param {Object} [value]
 */
const env = (value) => (process.env[KEY] = encode(value))

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
  it('should update value', async () => {
    await provider.connect()

    const foo = generate()

    await provider.set('foo', foo)

    expect(provider.object.foo).toStrictEqual(foo)
  })

  it('should keep old keys', async () => {
    const before = { bar: { a: random() } }

    env(before)

    await provider.connect()
    await provider.set('foo', generate())

    expect(provider.object).toMatchObject(before)
  })

  it('should set nested with dot notation', async () => {
    const a = random()

    await provider.connect()
    await provider.set('bar.a', a)

    expect(provider.object.bar.a).toStrictEqual(a)
  })

  it('should validate type', async () => {
    await provider.connect()

    expect(() => provider.set('bar.a', generate())).toThrow(TypeError)
  })
})

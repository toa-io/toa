'use strict'

const { Locator } = require('@toa.io/core')
const { encode } = require('@toa.io/libraries/generic')

const fixtures = require('./context.fixtures')
const { Factory } = require('../')
const { generate } = require('randomstring')

const factory = new Factory()

/** @type {toa.extensions.configuration.Context} */
let context

/** @type {toa.core.Locator} */
let locator

describe('defaults', () => {
  beforeEach(async () => {
    const namespace = generate()
    const name = generate()

    locator = new Locator(name, namespace)

    context = factory.context(locator, fixtures.schema)
    await context.connect()
  })

  it('should return schema defaults', () => {
    const foo = context.invoke(['foo'])

    expect(foo).toStrictEqual(fixtures.schema.properties.foo.default)
  })

  it('should return nested values', () => {
    const baz = context.invoke(['bar', 'baz'])

    expect(baz).toStrictEqual(fixtures.schema.properties.bar.properties.baz.default)
  })

  it('should expose configuration tree', () => {
    const configuration = context.invoke()

    expect(configuration).toStrictEqual({
      foo: fixtures.schema.properties.foo.default,
      bar: {
        baz: fixtures.schema.properties.bar.properties.baz.default
      },
      quu: 0
    })
  })
})

describe('resolution', () => {
  let object
  let varname

  beforeEach(() => {
    object = { foo: generate() }

    varname = 'TOA_CONFIGURATION_' + locator.uppercase
  })

  it('should resolve configuration object from environment variable', async () => {
    process.env[varname] = encode(object)

    context = factory.context(locator, fixtures.schema)
    await context.connect()

    const configuration = context.invoke()

    expect(configuration.foo).toStrictEqual(object.foo)
    expect(configuration.bar.baz).toStrictEqual(fixtures.schema.properties.bar.properties.baz.default)
  })
})

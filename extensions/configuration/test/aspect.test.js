'use strict'

const { Locator } = require('@toa.io/core')
const { encode } = require('@toa.io/generic')

const fixtures = require('./aspect.fixtures')
const { Factory } = require('../')
const { generate } = require('randomstring')

const factory = new Factory()

/** @type {toa.extensions.configuration.Aspect} */
let aspect

/** @type {toa.core.Locator} */
let locator

describe('defaults', () => {
  beforeEach(async () => {
    const namespace = generate()
    const name = generate()

    locator = new Locator(name, namespace)

    aspect = factory.aspect(locator, fixtures.schema)

    await aspect.connect()
  })

  it('should return schema defaults', () => {
    const foo = aspect.invoke(['foo'])

    expect(foo).toStrictEqual(fixtures.schema.properties.foo.default)
  })

  it('should return nested values', () => {
    const baz = aspect.invoke(['bar', 'baz'])

    expect(baz).toStrictEqual(fixtures.schema.properties.bar.properties.baz.default)
  })

  it('should expose configuration tree', () => {
    const configuration = aspect.invoke()

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

    aspect = factory.aspect(locator, fixtures.schema)

    await aspect.connect()

    const configuration = aspect.invoke()

    expect(configuration.foo).toStrictEqual(object.foo)
    expect(configuration.bar.baz).toStrictEqual(fixtures.schema.properties.bar.properties.baz.default)
  })
})

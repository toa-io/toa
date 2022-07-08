'use strict'

const { generate } = require('randomstring')
const { Locator } = require('../src/locator')

/** @type {string} */
let name

/** @type {string} */
let namespace

/** @type {toa.core.Locator} */
let locator

beforeEach(() => {
  name = generate()
  namespace = generate()

  locator = new Locator(name, namespace)
})

it('should expose name and namespace', () => {
  expect(locator.name).toStrictEqual(name)
  expect(locator.namespace).toStrictEqual(namespace)
})

it('should expose id, label', () => {
  expect(locator.id).toStrictEqual(locator.namespace + '.' + locator.name)
  expect(locator.label).toStrictEqual(locator.namespace + '-' + locator.name)
})

it('should expose uppercase', () => {
  expect(locator.uppercase).toStrictEqual((locator.namespace + '_' + locator.name).toUpperCase())
})

it('should throw if name is undefined', () => {
  expect(() => new Locator(undefined, namespace)).toThrow(TypeError)

  // noinspection JSCheckFunctionSignatures
  expect(() => new Locator()).toThrow(TypeError)
})

it('should expose host', () => {
  expect(locator.hostname()).toStrictEqual(namespace + '-' + name)
})

it('should expose host with given prefix', () => {
  const prefix = generate()

  expect(locator.hostname(prefix)).toStrictEqual(prefix + '-' + namespace + '-' + name)
})

describe('global', () => {
  beforeEach(() => {
    locator = new Locator(name)
  })

  it('should not throw', () => undefined)

  it('should expose id', () => {
    expect(locator.id).toStrictEqual(name)
  })

  it('should expose label', () => {
    expect(locator.label).toStrictEqual(name)
  })

  it('should expose uppercase', () => {
    expect(locator.uppercase).toStrictEqual(name.toUpperCase())
  })

  it('should expose hostname', () => {
    const type = generate()

    expect(locator.hostname(type)).toStrictEqual(type + '-' + name)
    expect(locator.hostname()).toStrictEqual(name)
  })
})

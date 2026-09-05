import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { Locator } from '../source/locator.js'

/** @type {string} */
let name

/** @type {string} */
let namespace

/** @type {import('@toa.io/core').Locator} */
let locator

beforeEach(() => {
  name = generate()
  namespace = generate()

  locator = new Locator(name, namespace)
})

it('should expose name and namespace', () => {
  assert.deepStrictEqual(locator.name, name)
  assert.deepStrictEqual(locator.namespace, namespace)
})

it('should expose id, label', () => {
  const id = locator.namespace + '.' + locator.name
  const label = locator.namespace.toLowerCase() + '-' + locator.name.toLowerCase()

  assert.deepStrictEqual(locator.id, id)
  assert.deepStrictEqual(locator.label, label)
})

it('should expose uppercase', () => {
  assert.deepStrictEqual(locator.uppercase, (locator.namespace + '_' + locator.name).toUpperCase())
})

it('should throw if name is undefined', () => {
  assert.throws(() => new Locator(undefined, namespace), TypeError)

  // noinspection JSCheckFunctionSignatures
  assert.throws(() => new Locator(), TypeError)
})

it('should expose host', () => {
  assert.deepStrictEqual(locator.hostname(), (namespace + '-' + name).toLowerCase())
})

it('should expose host with given prefix', () => {
  const prefix = generate()

  assert.deepStrictEqual(locator.hostname(prefix), (prefix + '-' + namespace + '-' + name).toLowerCase())
})

describe('global', () => {
  beforeEach(() => {
    locator = new Locator(name)
  })

  it('should not throw', () => undefined)

  it('should expose id', () => {
    assert.deepStrictEqual(locator.id, name)
  })

  it('should expose label', () => {
    assert.deepStrictEqual(locator.label, name.toLowerCase())
  })

  it('should expose uppercase', () => {
    assert.deepStrictEqual(locator.uppercase, name.toUpperCase())
  })

  it('should expose hostname', () => {
    const type = generate()

    assert.deepStrictEqual(locator.hostname(type), (type + '-' + name).toLowerCase())
    assert.deepStrictEqual(locator.hostname(), name.toLowerCase())
  })
})

describe('parse', () => {
  it('should be', async () => {
    assert.ok(Locator.parse instanceof Function)
  })

  const namespace = generate()
  const name = generate()
  const id = `${namespace}.${name}`

  it('should parse id', async () => {
    const locator = Locator.parse(id)

    assert.deepStrictEqual(locator.namespace, namespace)
    assert.deepStrictEqual(locator.name, name)
  })

  it('should parse endpoint', async () => {
    const endpoint = `${id}.${generate()}`
    const locator = Locator.parse(endpoint)

    assert.deepStrictEqual(locator.namespace, namespace)
    assert.deepStrictEqual(locator.name, name)
  })

  it('should parse token as global', async () => {
    const locator = Locator.parse(name)

    assert.strictEqual(locator.namespace, undefined)
    assert.deepStrictEqual(locator.name, name)
  })
})

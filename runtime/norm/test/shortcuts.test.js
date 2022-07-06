'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const { recognize, resolve } = require('../src/shortcuts')
const fixtures = require('./shortcuts.fixtures')

let object

beforeEach(() => {
  object = clone(fixtures.object)
})

describe('resolve', () => {
  it('should be defined', () => {
    expect(resolve).toBeDefined()
  })

  it('should resolve', () => {
    expect(Object.keys(fixtures.SHORTCUTS).length).toBeGreaterThan(0)

    for (const [key, value] of Object.entries(fixtures.SHORTCUTS)) {
      const resolved = resolve(key)

      expect(resolved).toStrictEqual(value)
    }
  })
})

describe('recognize', () => {
  it('should not change unknown', () => {
    recognize(object)

    expect(object).toStrictEqual(fixtures.object)
  })

  it('should resolve known', () => {
    const known = append()

    recognize(object)

    for (const [alias, name] of Object.entries(fixtures.SHORTCUTS)) {
      expect(object[alias]).toBeUndefined()
      expect(object[name]).toStrictEqual(known[name])
    }
  })

  it('should group known', () => {
    const known = append()
    const group = generate()

    recognize(object, group)

    expect(object[group]).toStrictEqual(known)

    for (const alias of Object.keys(fixtures.SHORTCUTS)) expect(object[alias]).toBeUndefined()
  })

  it('should not overwrite group', () => {
    append()
    const group = generate()
    const existing = { [generate()]: generate() }

    object[group] = clone(existing)

    recognize(object, group)

    expect(object[group]).toStrictEqual(expect.objectContaining(existing))
  })

  it('should not create empty group', () => {
    const group = generate()

    recognize(object, group)

    expect(object[group]).toBeUndefined()
  })

  const append = () => {
    const known = {}

    for (const [alias, name] of Object.entries(fixtures.SHORTCUTS)) {
      const value = { [generate()]: generate() }

      object[alias] = clone(value)
      known[name] = clone(value)
    }

    return known
  }
})

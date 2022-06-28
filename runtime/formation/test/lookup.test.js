'use strict'

const path = require('node:path')
const clone = require('clone-deep')
const { generate } = require('randomstring')

const { recognize, resolve } = require('../src/lookup')
const fixtures = require('./lookup.fixtures')

let object

beforeEach(() => {
  object = clone(fixtures.object)
})

describe('resolve', () => {
  it('should resolve runtime package references', () => {
    const target = path.dirname(require.resolve('@toa.io/formation/package.json'))
    const result = resolve('@toa.io/formation', generate())

    expect(result).toStrictEqual(target)
  })

  it('should throw on unknown packages', () => {
    expect(() => resolve(generate(), generate())).toThrow(/Cannot resolve module/)
  })

  it('should resolve relative path', () => {
    const root = path.resolve(__dirname, '../')
    const ref = '../core'
    const target = path.resolve(root, ref)
    const result = resolve(ref, root)

    expect(result).toStrictEqual(target)
  })

  it('should not resolve relative path as runtime package', () => {
    const root = path.resolve(__dirname, '../')
    const result = resolve('.', root)

    expect(result).toStrictEqual(root)
  })

  it('should not resolve absolute path as runtime package', () => {
    const root = path.resolve(__dirname, '../')
    const result = resolve(root, generate())

    expect(result).toStrictEqual(root)
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

    for (const [alias, name] of Object.entries(fixtures.KNOWN)) {
      expect(object[alias]).toBeUndefined()
      expect(object[name]).toStrictEqual(known[name])
    }
  })

  it('should group known', () => {
    const known = append()
    const group = generate()

    recognize(object, group)

    expect(object[group]).toStrictEqual(known)

    for (const alias of Object.keys(fixtures.KNOWN)) expect(object[alias]).toBeUndefined()
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

    for (const [alias, name] of Object.entries(fixtures.KNOWN)) {
      const value = { [generate()]: generate() }

      object[alias] = clone(value)
      known[name] = clone(value)
    }

    return known
  }
})

'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

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
    assert.notStrictEqual(resolve, undefined)
  })

  it('should resolve', () => {
    assert.ok(Object.keys(fixtures.SHORTCUTS).length > 0)

    for (const [key, value] of Object.entries(fixtures.SHORTCUTS)) {
      const resolved = resolve(key)

      assert.deepStrictEqual(resolved, value)
    }
  })
})

describe('recognize', () => {
  it('should not change unknown', () => {
    recognize(fixtures.SHORTCUTS, object)

    assert.deepStrictEqual(object, fixtures.object)
  })

  it('should resolve known', () => {
    const known = append()

    recognize(fixtures.SHORTCUTS, object)

    for (const [alias, name] of Object.entries(fixtures.SHORTCUTS)) {
      assert.strictEqual(object[alias], undefined)
      assert.deepStrictEqual(object[name], known[name])
    }
  })

  it('should group known', () => {
    const known = append()
    const group = generate()

    recognize(fixtures.SHORTCUTS, object, group)

    assert.deepStrictEqual(object[group], known)

    for (const alias of Object.keys(fixtures.SHORTCUTS)) assert.strictEqual(object[alias], undefined)
  })

  it('should not overwrite group', () => {
    append()

    const group = generate()
    const existing = { [generate()]: generate() }

    object[group] = clone(existing)

    recognize(fixtures.SHORTCUTS, object, group)

    assert.partialDeepStrictEqual(object[group], existing)
  })

  it('should not create empty group', () => {
    const group = generate()

    recognize(object, group)

    assert.strictEqual(object[group], undefined)
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

'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { letters } = require('../')

describe('up', () => {
  const up = letters.up

  it('should be', () => {
    assert.ok(up instanceof Function)
  })

  it('should uppercase', () => {
    const lower = 'foo-bar-baz'
    const upper = up(lower)

    assert.deepStrictEqual(upper, 'FOO_BAR_BAZ')
  })
})

describe('down', () => {
  const down = letters.down

  it('should be', () => {
    assert.ok(down instanceof Function)
  })

  it('should uppercase', () => {
    const upper = 'FOO_BAR_BAZ'
    const lower = down(upper)

    assert.deepStrictEqual(lower, 'foo-bar-baz')
  })
})

describe('capitalize', () => {
  const capitalize = letters.capitalize

  it('should be', () => {
    assert.notStrictEqual(capitalize, undefined)
  })

  it('should capitalize', () => {
    const input = 'user name'
    const capitalized = 'User name'
    const output = capitalize(input)

    assert.deepStrictEqual(output, capitalized)
  })
})

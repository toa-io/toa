'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./manifest.fixtures')
const { manifest } = require('../source')

let declaration

beforeEach(() => {
  declaration = clone(fixtures.declaration)
})

const exec = () => manifest(declaration)
const gen = () => 'https://host-' + generate().toLowerCase() + '.com'

it('should expand origins', () => {
  const origins = {
    [generate()]: gen(),
    [generate()]: gen()
  }

  const value = clone(origins)
  const result = manifest(value)

  expect(result).toStrictEqual({ origins })
})

it('should not throw if valid', () => {
  expect(exec).not.toThrow()
})

it('should require origins', () => {
  delete declaration.origins

  expect(exec).toThrow(/fewer than 1/)
})

it('should require at least one origin', () => {
  declaration.origins = {}

  expect(exec).toThrow(/fewer than 1/)
})

it('should require origin values as strings', () => {
  declaration.origins.foo = ['bar', 'baz']

  expect(exec).toThrow(/must be string/)
})

describe('origin', () => {
  it('should require origin values as web origins', () => {
    declaration.origins.foo = 'http://origin/with/path'

    expect(exec).toThrow(/must match pattern/)
  })
})

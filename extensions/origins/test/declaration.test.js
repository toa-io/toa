'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./declaration.fixtures')
const { declaration: { normalize, validate } } = require('../src')

let declaration

beforeEach(() => {
  declaration = clone(fixtures.declaration)
})

describe('normalize', () => {
  it('should expand origins', () => {
    const origins = {
      [generate()]: generate(),
      [generate()]: generate()
    }

    const value = clone(origins)

    normalize(value)

    expect(value).toStrictEqual({ origins })
  })
})

describe('validate', () => {
  const exec = () => validate(declaration)

  it('should not throw if valid', () => {
    expect(exec).not.toThrow()
  })

  it('should require origins', () => {
    delete declaration.origins

    expect(exec).toThrow(/must have required property 'origins'/)
  })

  it('should require at least one origin', () => {
    declaration.origins = {}

    expect(exec).toThrow(/fewer than 1 items/)
  })

  it('should require origin values as strings', () => {
    declaration.origins.foo = ['bar', 'baz']

    expect(exec).toThrow(/must be string/)
  })
})
